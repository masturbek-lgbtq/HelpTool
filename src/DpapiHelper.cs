using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace PersonalAssistantDpapi
{
    internal static class Program
    {
        private static readonly byte[] Entropy = Encoding.UTF8.GetBytes("PersonalAssistant_DPAPI_v1");

        private static int Main(string[] args)
        {
            if (args.Length < 1)
            {
                Console.Error.WriteLine("Usage: dpapi.exe <encrypt|decrypt> [base64_or_dpapi_value]");
                return 1;
            }

            string mode = args[0].Trim().ToLowerInvariant();
            string input = args.Length >= 2 ? args[1] : Console.In.ReadToEnd();
            input = (input ?? string.Empty).Trim();

            if (input.Length == 0)
            {
                return 0;
            }

            try
            {
                if (mode == "encrypt")
                {
                    if (input.StartsWith("dpapi:", StringComparison.Ordinal))
                    {
                        Console.Write(input);
                        return 0;
                    }

                    byte[] plainBytes = Convert.FromBase64String(input);
                    byte[] protectedBytes = ProtectedData.Protect(
                        plainBytes,
                        Entropy,
                        DataProtectionScope.CurrentUser
                    );
                    Console.Write("dpapi:" + Convert.ToBase64String(protectedBytes));
                    return 0;
                }

                if (mode == "decrypt")
                {
                    string payload = input.StartsWith("dpapi:", StringComparison.Ordinal)
                        ? input.Substring("dpapi:".Length)
                        : input;
                    byte[] protectedBytes = Convert.FromBase64String(payload);
                    byte[] plainBytes = ProtectedData.Unprotect(
                        protectedBytes,
                        Entropy,
                        DataProtectionScope.CurrentUser
                    );
                    Console.Write(Convert.ToBase64String(plainBytes));
                    return 0;
                }

                Console.Error.WriteLine("Unknown mode: " + mode);
                return 1;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.Message);
                return 2;
            }
        }
    }
}
