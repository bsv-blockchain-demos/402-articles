---
title: 'Siggi Releases IDE That Supports 8 Languages, Used by 8 People'
excerpt: 'Groundbreaking developer tool achieves perfect 1:1 language-to-user ratio.'
author: Deigan Cullenskink
date: '2026-03-14'
price: 75
image: /images/g2.png
---
<p class="lead">REYKJAVIK &mdash; Siggi Oskarsson, the mass-producing developer behind the Run&aacute;r smart contract compiler, has released an online playground at runar.run that lets developers write Bitcoin smart contracts in eight different programming languages entirely in the browser. TNT can exclusively report that one developer has tried it in each language, bringing the total user base to what sources describe as "a statistically significant sample of the BSV developer community."</p>

<h2>No Backend, No Users, No Problem</h2>
<p>The playground, which runs entirely client-side with no backend, requires no installation, no sign-up, and no evidence that anyone will ever use it. "Every Bitcoin smart contract developer has the same first question," Siggi wrote in his announcement. "Can I try it before I install anything?" TNT reached out to every Bitcoin smart contract developer and he confirmed this was true.</p>
<p>The tool supports TypeScript, Go, Rust, Solidity, Move, Python, Zig, and Ruby. When asked why eight languages were necessary, Siggi explained: "Different developers think in different syntaxes. Some think in TypeScript. Some think in Rust. Some think in Ruby, though we're not sure those people should be writing financial contracts."</p>
<p>All eight languages compile to identical Bitcoin Script output. "It's like the Tower of Babel," said one BSV developer, "except instead of God confusing the languages to scatter humanity, Siggi unified them to write OP_CHECKSIG."</p>

<h2>A Real Debugger For a Theoretical User Base</h2>
<p>The playground's centrepiece is a step-through debugger that lets developers walk through every Bitcoin Script opcode one at a time, forwards and backwards. The main stack and alt stack update after each step. IF/ELSE/ENDIF blocks are indented. Non-taken branches can be skipped with a toggle.</p>
<p>"It's the kind of debugger you'd expect from a mature IDE," Siggi wrote. TNT can confirm this is true. It is also the kind of debugger you'd expect to be used by more than four people.</p>
<p>The debugger auto-generates real ECDSA signatures for test execution. Three deterministic key pairs &mdash; Alice, Bob, and Charlie &mdash; are built in. When asked if a fourth test key would be added, Siggi said there was "no need, as Alice, Bob, and Charlie already outnumber the platform's active user base."</p>

<h2>The Share Button That Changed Nothing</h2>
<p>Perhaps the playground's most ambitious feature is its share functionality. Clicking "Share" compresses the entire contract into a URL fragment using LZ-string compression. No data hits a server. Anyone with the link can load the exact contract, ready to compile.</p>
<p>"This means bug reports, teaching examples, and contract reviews can all be a single URL," Siggi explained. TNT investigated and found that the feature has been used three times: once by Siggi to test it, once by Siggi to share it with someone who did not click it, and once by a bot indexing the page.</p>
<p>The URL-based sharing also means that, in theory, an entire smart contract economy could be bootstrapped through hyperlinks. In practice, the longest chain of shares so far is Siggi sending a link to Siggi's other browser tab.</p>

<h2>Post-Quantum Before Post-Relevance</h2>
<p>The playground is reportedly capable of compiling post-quantum signature schemes that produce hundreds of kilobytes of script. Web Workers keep the UI responsive during compilation. "This is future-proof technology," Siggi told TNT. "When quantum computers arrive and break ECDSA, the six people using BSV smart contracts will be fully prepared."</p>
<p>The compiler runs with a 600ms debounce after each edit. Errors appear with line numbers. Compilation state is shown in a status bar. "It's extremely polished," said an anonymous developer who requested we clarify that he is "not Siggi using a different browser."</p>

<h2>Drag and Drop Into the Void</h2>
<p>The playground also supports drag-and-drop: developers can drag .runar.ts, .runar.py, .runar.rb, .runar.zig, or other supported contract files directly onto the browser window. Eight file extensions are recognised.</p>
<p>TNT attempted to test this feature but could not locate anyone with a .runar.rb file on their filesystem. We created one ourselves. It compiled. The debugger worked. The stack was correct. There was no one to share it with.</p>

<h2>Community Response</h2>
<p>The BSV Slack reacted warmly to the announcement. "This is incredible," wrote @builds_things_nobody_uses, who is reportedly also working on a BSV-powered toaster. Calvin Ayre retweeted the announcement with the comment: "BSV developer tools are years ahead of the competition. Siggi is a genius. Buy BSV."</p>
<p>At press time, Siggi was already working on his next project: a Run&aacute;r language server protocol extension for Vim, Emacs, VS Code, Sublime Text, Atom, Notepad++, ed, and a custom text editor he built himself. When asked about the target user base, he said "it's not about the users, it's about the opcodes."</p>
