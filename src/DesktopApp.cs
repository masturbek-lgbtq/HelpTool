using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Web.Script.Serialization;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace PersonalAssistantDesktop
{
    internal static class Program
    {
        private const string BaseUrl = "http://127.0.0.1:3847";
        private static readonly string AppDir = AppDomain.CurrentDomain.BaseDirectory;
        private static readonly HttpClient Http = new HttpClient { Timeout = TimeSpan.FromSeconds(4) };
        private static readonly JavaScriptSerializer Json = new JavaScriptSerializer();

        private static Form mainForm;
        private static WebView2 webView;
        private static NotifyIcon trayIcon;
        private static System.Windows.Forms.Timer pollTimer;
        private static Icon appIcon;
        private static bool isPolling;
        private static bool isExiting;
        private static string lastAlertUrl = "";

        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [DllImport("user32.dll")]
        private static extern bool SetProcessDpiAwarenessContext(IntPtr dpiFlag);

        [DllImport("user32.dll")]
        private static extern IntPtr GetThreadDesktop(uint dwThreadId);

        [DllImport("kernel32.dll")]
        private static extern uint GetCurrentThreadId();

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        private static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, int nLength, out int lpnLengthNeeded);

        private static string GetCurrentDesktopName()
        {
            try
            {
                IntPtr hDesk = GetThreadDesktop(GetCurrentThreadId());
                if (hDesk != IntPtr.Zero)
                {
                    var sb = new StringBuilder(256);
                    int needed;
                    if (GetUserObjectInformation(hDesk, 2, sb, sb.Capacity, out needed))
                    {
                        var clean = new StringBuilder();
                        foreach (char ch in sb.ToString())
                        {
                            if (char.IsLetterOrDigit(ch) || ch == '_' || ch == '-')
                            {
                                clean.Append(ch);
                            }
                        }
                        if (clean.Length > 0) return clean.ToString();
                    }
                }
            }
            catch { }
            return "Default";
        }

        private static void EnableHighDpi()
        {
            try
            {
                // DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = -4
                if (SetProcessDpiAwarenessContext(new IntPtr(-4))) return;
            }
            catch { }
            try
            {
                SetProcessDPIAware();
            }
            catch { }
        }

        [STAThread]
        private static void Main()
        {
            EnableHighDpi();
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string deskName = GetCurrentDesktopName();
            bool createdNew;
            using (var mutex = new Mutex(true, "PersonalAssistantTrayMutex_v2_" + deskName, out createdNew))
            using (var showEvent = new EventWaitHandle(false, EventResetMode.AutoReset, "PersonalAssistantShowEvent_v2_" + deskName))
            {
                EnsureBackendRunning();

                if (!createdNew)
                {
                    showEvent.Set();
                    return;
                }

                LoadAppIcon();
                InitializeMainForm();
                InitializeTray();

                ThreadPool.RegisterWaitForSingleObject(showEvent, (state, timedOut) =>
                {
                    if (mainForm != null && !mainForm.IsDisposed)
                    {
                        try
                        {
                            mainForm.BeginInvoke((Action)(() => ShowMainWindow()));
                        }
                        catch { }
                    }
                }, null, -1, false);

                Application.Run(mainForm);

                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
            }
        }

        private static void LoadAppIcon()
        {
            try
            {
                string icoFileV2 = Path.Combine(AppDir, "joker-noir-v2.ico");
                if (File.Exists(icoFileV2))
                {
                    appIcon = new Icon(icoFileV2);
                    return;
                }
            }
            catch { }

            try
            {
                appIcon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch { }

            if (appIcon == null)
            {
                appIcon = SystemIcons.Application;
            }
        }

        private static bool IsBackendAlive()
        {
            try
            {
                var res = Http.GetAsync(BaseUrl + "/api/state").GetAwaiter().GetResult();
                return res.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        private static void EnsureBackendRunning()
        {
            if (IsBackendAlive()) return;

            string vbsPath = Path.Combine(AppDir, "start-bot.vbs");
            if (File.Exists(vbsPath))
            {
                try
                {
                    var psi = new ProcessStartInfo("wscript.exe", "\"" + vbsPath + "\"")
                    {
                        WorkingDirectory = AppDir,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };
                    Process.Start(psi);
                }
                catch { }
            }

            var sw = Stopwatch.StartNew();
            while (sw.ElapsedMilliseconds < 5000)
            {
                Thread.Sleep(300);
                if (IsBackendAlive()) break;
            }
        }

        private static void InitializeMainForm()
        {
            var workArea = Screen.PrimaryScreen != null
                ? Screen.PrimaryScreen.WorkingArea
                : new Rectangle(0, 0, 1280, 860);
            int width = Math.Min(1220, Math.Max(420, workArea.Width - 80));
            int height = Math.Min(900, Math.Max(580, workArea.Height - 60));

            mainForm = new Form
            {
                Text = "Помощник",
                Icon = appIcon,
                AutoScaleMode = AutoScaleMode.Dpi,
                Size = new Size(width, height),
                MinimumSize = new Size(400, 560),
                StartPosition = FormStartPosition.CenterScreen,
                BackColor = Color.FromArgb(10, 10, 11)
            };

            webView = new WebView2
            {
                Dock = DockStyle.Fill
            };
            mainForm.Controls.Add(webView);

            mainForm.Shown += async (s, e) => await InitWebViewAsync();

            mainForm.FormClosing += (s, e) =>
            {
                if (!isExiting && e.CloseReason == CloseReason.UserClosing)
                {
                    e.Cancel = true;
                    mainForm.Hide();
                }
            };
        }

        private static async Task InitWebViewAsync()
        {
            try
            {
                string userDataDir = Path.Combine(AppDir, "webview-data");
                var env = await CoreWebView2Environment.CreateAsync(null, userDataDir);
                await webView.EnsureCoreWebView2Async(env);

                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.NewWindowRequested += (s, e) =>
                {
                    e.Handled = true;
                    try
                    {
                        Process.Start(new ProcessStartInfo(e.Uri) { UseShellExecute = true });
                    }
                    catch { }
                };

                webView.Source = new Uri(BaseUrl + "/");
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Не удалось запустить встроенное окно: " + ex.Message,
                    "Помощник",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        private static void ShowMainWindow()
        {
            if (mainForm == null || mainForm.IsDisposed) return;
            if (!mainForm.Visible) mainForm.Show();
            if (mainForm.WindowState == FormWindowState.Minimized)
            {
                mainForm.WindowState = FormWindowState.Normal;
            }
            mainForm.Activate();
            mainForm.BringToFront();
        }

        private static void InitializeTray()
        {
            var menu = new ContextMenuStrip();
            menu.Items.Add("Открыть Помощник", null, (s, e) => ShowMainWindow());
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Пауза только на уроки (вкл/выкл)", null, (s, e) => TogglePauseSetting("pause_lessons", "Пауза только на уроки"));
            menu.Items.Add("Полная тишина (вкл/выкл)", null, (s, e) => TogglePauseSetting("pause_all", "Полная тишина"));
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Полный выход (остановить бота)", null, (s, e) => StopBotAndExit());
            menu.Items.Add("Закрыть приложение", null, (s, e) => ExitApp());

            trayIcon = new NotifyIcon
            {
                Icon = appIcon,
                Text = "Личный помощник",
                ContextMenuStrip = menu,
                Visible = true
            };

            trayIcon.MouseClick += (s, e) =>
            {
                if (e.Button == MouseButtons.Left)
                {
                    ShowMainWindow();
                }
            };
            trayIcon.DoubleClick += (s, e) => ShowMainWindow();
            trayIcon.BalloonTipClicked += (s, e) =>
            {
                if (!string.IsNullOrWhiteSpace(lastAlertUrl))
                {
                    try
                    {
                        Process.Start(new ProcessStartInfo(lastAlertUrl) { UseShellExecute = true });
                        return;
                    }
                    catch { }
                }
                ShowMainWindow();
            };

            pollTimer = new System.Windows.Forms.Timer { Interval = 5000 };
            pollTimer.Tick += async (s, e) =>
            {
                if (isPolling) return;
                isPolling = true;
                try
                {
                    string body = await Http.GetStringAsync(BaseUrl + "/api/desktop-alerts");
                    var data = Json.Deserialize<Dictionary<string, object>>(body);
                    if (data != null && data.ContainsKey("alerts"))
                    {
                        var list = data["alerts"] as ArrayList;
                        if (list != null)
                        {
                            foreach (object itemObj in list)
                            {
                                var item = itemObj as Dictionary<string, object>;
                                if (item == null) continue;
                                string title = item.ContainsKey("title") && item["title"] != null ? item["title"].ToString() : "Помощник";
                                string msg = item.ContainsKey("message") && item["message"] != null ? item["message"].ToString() : "";
                                string url = item.ContainsKey("url") && item["url"] != null ? item["url"].ToString() : "";
                                lastAlertUrl = url;
                                if (string.IsNullOrWhiteSpace(msg)) msg = title;
                                trayIcon.ShowBalloonTip(8000, title, msg, ToolTipIcon.Info);
                            }
                        }
                    }
                }
                catch { }
                finally
                {
                    isPolling = false;
                }
            };
            pollTimer.Start();
        }

        private static async void TogglePauseSetting(string settingKey, string label)
        {
            try
            {
                string stateJson = await Http.GetStringAsync(BaseUrl + "/api/state");
                var state = Json.Deserialize<Dictionary<string, object>>(stateJson);
                string currentVal = "0";
                if (state != null && state.ContainsKey("settings"))
                {
                    var settings = state["settings"] as Dictionary<string, object>;
                    if (settings != null && settings.ContainsKey(settingKey) && settings[settingKey] != null)
                    {
                        currentVal = settings[settingKey].ToString();
                    }
                }

                string nextVal = currentVal == "1" ? "0" : "1";
                string payload = "{\"" + settingKey + "\":\"" + nextVal + "\"}";
                var content = new StringContent(payload, Encoding.UTF8, "application/json");
                var res = await Http.PostAsync(BaseUrl + "/api/settings", content);
                if (res.IsSuccessStatusCode)
                {
                    lastAlertUrl = "";
                    string statusText = nextVal == "1" ? "включена" : "выключена";
                    trayIcon.ShowBalloonTip(4000, "Помощник", label + ": " + statusText, ToolTipIcon.Info);
                }
            }
            catch
            {
                trayIcon.ShowBalloonTip(4000, "Помощник", "Не удалось изменить режим (проверьте запуск бота)", ToolTipIcon.Warning);
            }
        }

        private static void ExitApp()
        {
            isExiting = true;
            Application.Exit();
        }

        private static void StopBotAndExit()
        {
            isExiting = true;
            string stopCmd = Path.Combine(AppDir, "stop-bot.cmd");
            if (File.Exists(stopCmd))
            {
                try
                {
                    var psi = new ProcessStartInfo("cmd.exe", "/c \"" + stopCmd + "\"")
                    {
                        WorkingDirectory = AppDir,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };
                    Process.Start(psi);
                }
                catch { }
            }
            Application.Exit();
        }
    }
}
