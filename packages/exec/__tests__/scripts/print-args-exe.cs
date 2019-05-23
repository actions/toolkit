using System;
namespace PrintArgs
{
    public static class Program
    {
        public static void Main(string[] args)
        {
            for (int i = 0 ; i < args.Length ; i++)
            {
                Console.WriteLine("args[{0}]: '{1}'", i, args[i]);
            }
        }
    }
}
