Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
botDir = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = botDir

If fso.FileExists(botDir & "\bot.pid") Then
  On Error Resume Next
  Set pidFile = fso.OpenTextFile(botDir & "\bot.pid", 1)
  oldPid = Trim(pidFile.ReadAll)
  pidFile.Close
  If oldPid <> "" Then
    shell.Run "cmd.exe /c taskkill /PID " & oldPid & " /F >nul 2>&1", 0, True
  End If
  On Error GoTo 0
End If

nodeExe = botDir & "\bin\node.exe"
If Not fso.FileExists(nodeExe) Then nodeExe = "C:\Program Files\nodejs\node.exe"
If Not fso.FileExists(nodeExe) Then nodeExe = "node.exe"

cmd = "cmd.exe /c """"" & nodeExe & """ """ & botDir & "\bot.js"" >> """ & botDir & "\bot.log"" 2>&1"""
shell.Run cmd, 0, False
