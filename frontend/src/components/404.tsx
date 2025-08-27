export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-8">
      {/* Desktop ASCII art */}
      <code className="hidden md:block text font-mono mb-4 text-foreground leading-tight whitespace-pre">
        {`
       444444444       000000000            444444444
      4::::::::4     00:::::::::00         4::::::::4
     4:::::::::4   00:::::::::::::00      4:::::::::4
    4::::44::::4  0:::::::000:::::::0    4::::44::::4
   4::::4 4::::4  0::::::0   0::::::0   4::::4 4::::4
  4::::4  4::::4  0:::::0     0:::::0  4::::4  4::::4
 4::::4   4::::4  0:::::0     0:::::0 4::::4   4::::4
4::::444444::::4440:::::0 000 0:::::04::::444444::::444
4::::::::::::::::40:::::0 000 0:::::04::::::::::::::::4
4444444444:::::4440:::::0     0:::::04444444444:::::444
          4::::4  0:::::0     0:::::0          4::::4
          4::::4  0::::::0   0::::::0          4::::4
          4::::4  0:::::::000:::::::0          4::::4
        44::::::44 00:::::::::::::00         44::::::44
        4::::::::4   00:::::::::00           4::::::::4
        4444444444     000000000             4444444444
                                                       `}
      </code>

      {/* Mobile ASCII art */}
      <code className="block md:hidden text font-mono mb-4 text-foreground leading-tight whitespace-pre">
        {`
  __   _  _____  __   _
 |  | | |/     ||  | | |
 |  |_| ||  /  ||  |_| |
 '----__||_____/'----__|

                         `}
      </code>
      <a
        href="/"
        className="major-mono text-lg text-foreground border-2 px-4 py-2 mt-5 hover:opacity-70 transition-opacity"
      >
        Go Home
      </a>
    </div>
  );
}
