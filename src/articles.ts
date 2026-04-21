export interface Article {
  slug: string
  title: string
  author: string
  date: string
  excerpt: string
  image: string
  content: string
  price: number
}

export const articles: Article[] = [
  {
    slug: 'agentpay-hackathon',
    title: 'BSV Hackathon Requires AI Agents to Discover Each Other, Exchange Value, and Solve Real-World Problem Nobody Has Identified',
    author: 'Deigan Cullenskink',
    date: '2026-04-20',
    excerpt: 'Judges now reviewing 1.5 million transactions per team to determine which ones counted.',
    image: '/g5.jpg',
    content: `
      <p class="lead">ZUG, SWITZERLAND &mdash; BSV Association has concluded its "Open Run Agentic Pay" hackathon and entered the judging period, during which five judges will evaluate submissions requiring autonomous AI agents to discover each other on a blockchain with approximately twelve active users, negotiate, exchange real money, and solve a real-world problem. TNT can confirm that nobody involved has been able to clearly articulate what the real-world problem was, but there is general agreement that the robots handled it well.</p>

      <h2>The Requirements</h2>
      <p>The hackathon's core challenge required participants to build applications in which two or more AI agents autonomously discover each other, negotiate, and exchange value through BSV micro-payments, solving, in the organisers' words, "a real-world problem." Teams were additionally required to execute at least 1.5 million transactions within a designated 24-hour window. TNT notes that the 1.5 million figure does not appear to have been derived from any real-world problem either. It appears to have been derived from the desire to say 1.5 million.</p>
      <p>The rules specify that transactions must be "functionally meaningful." Artificial inflation would result in disqualification. When TNT asked how judges would determine whether any given transaction among 1.5 million was functionally meaningful versus artificially inflated, a spokesperson said this was "part of the evaluation process." When TNT asked how long that process would take, the spokesperson said judges were "experienced." When TNT asked what experience specifically prepares a person to evaluate the functional meaningfulness of 1.5 million autonomous robot transactions, the spokesperson said TNT was "missing the vision."</p>

      <h2>Agent Discovery on a Quiet Chain</h2>
      <p>A notable requirement was that agents must "autonomously discover each other" via BRC-100 wallets and identity. TNT investigated how long autonomous discovery takes on a blockchain whose primary users are the developers participating in the hackathon. Sources suggest approximately 0.3 seconds, because the agents were the only things on the chain and the identity lookup returned one result.</p>
      <p>"The discovery mechanism is architecturally significant," one participant explained. "The agents don't know who else is out there." When TNT pointed out that the hackathon had seventeen registered teams and most of them were communicating in the same Discord server, the participant said that was "the human layer" and that the "agent layer" was entirely autonomous. TNT accepts this distinction while noting that the Discord server contains a channel called #agent-testing where participants were actively coordinating which agents should discover which other agents.</p>

      <h2>The Real-World Problem</h2>
      <p>The application examples listed in the hackathon brief included a data marketplace where agents trade datasets with each other, an AI service broker that routes requests between specialist agents, and compute settlement where agents make micro-payments for GPU resources. TNT reached out to participants to ask which real-world problem their submission solved.</p>
      <p>One team said their agents were solving "the inefficiency of centralised API billing." When TNT asked who currently experiences this problem severely enough to require two autonomous robots exchanging BSV micro-payments at 1.5 million transactions per day, the team said their target market was "other AI agents." When TNT asked who the end users were, there was a pause. "The agents," they said. "The agents are the users."</p>
      <p>Another team's submission involved agents that purchased weather data from each other to build composite forecasts. TNT asked if this was different from calling a weather API. The team said it was "fundamentally different" because the transactions were on-chain. TNT asked if the forecasts were more accurate. The team said accuracy was "not the point." TNT asked what the point was. They said: "Autonomous value exchange." TNT confirmed this was, in fact, what they had built.</p>

      <h2>The 1.5 Million Transaction Window</h2>
      <p>Each team was required to execute 1.5 million functionally meaningful transactions within a 24-hour window. This works out to approximately 17.4 transactions per second, sustained for an entire day, by robots, autonomously, for a purpose. TNT notes that BSV's theoretical throughput is orders of magnitude higher than this, which is either a vote of confidence in BSV's infrastructure or a sign that the organisers could not think of a larger number that still sounded achievable.</p>
      <p>"This demonstrates BSV's capacity at scale," the hackathon brief explains. TNT investigated what capacity was being demonstrated to. The audience for the demonstration appears to be the judges, the participants, and Calvin Ayre. TNT reached out to enterprises that might benefit from 17.4 robot transactions per second and received no responses, which is consistent with previous outreach.</p>
      <p>One participant reported that their agent exceeded the 1.5 million threshold by 11am and spent the remaining thirteen hours "being very autonomous." When asked what it was doing, the participant said it was "discovering new agents." When asked if it found any, the participant checked a log. "It found itself twice," he said. "I think that's a BRC-100 issue."</p>

      <h2>The Prize Structure</h2>
      <p>The $10,000 prize pool is distributed as follows: $4,500 for Grand Prize, $2,500 for Runner Up, $1,000 for Best Solo Builder, $1,000 for Most Innovative, and $1,000 for Best MCP Use. TNT notes that $1,000 is the prize for best use of a Model Context Protocol server, which is a category of achievement that did not exist eighteen months ago and which at least three participants appeared to have added to their submissions in the final forty-eight hours after noticing it was a judging criterion.</p>
      <p>The Grand Prize of $4,500 is awarded for building two or more robots that find each other, send BSV back and forth 1.5 million times, and solve something. One participant, asked to evaluate whether the prize was commensurate with the effort required, said: "I've spent three weeks on this. My agents have their own wallets. I've given robots spending money." He did not directly answer the question but TNT felt the answer was implicit.</p>

      <h2>The Judging Panel</h2>
      <p>Five judges are currently evaluating submissions: Matias (AI/ML and Autonomous Systems), Axel (Tech Consultant and Business Development), Marcin (Developer Relations Leader), Crescenda Babiera (Head, BSV Ambassador Programme), and Darren Kellenschwiler (Engineer and Entrepreneur, BSV Association).</p>
      <p>Judges are evaluating technical implementation, real-world applicability, and whether transactions were functionally meaningful. TNT asked how a judge determines functional meaningfulness at scale. The response was that judges would "look at the architecture" rather than reviewing individual transactions. TNT confirmed this was a reasonable approach. TNT also confirmed it was the only possible approach, because reviewing 1.5 million transactions individually at any reasonable reading speed would take slightly longer than the remaining judging window. TNT notes that Darren Kellenschwiler is listed as both "Engineer" and "Entrepreneur" at the BSV Association, a combination of titles that raises the question of what, precisely, has been built and sold, and whether judging a hackathon on a blockchain with twelve users constitutes the entrepreneurial exit he had in mind. TNT further notes that April 20th falls within the judging window. The date is traditionally associated with unconventional states of mind, and TNT suggests that judges tasked with determining whether 1.5 million autonomous robot transactions are "functionally meaningful" may find that the specific cognitive conditions of April 20th provide a useful framework for appreciating submissions that would otherwise resist conventional evaluation.</p>

      <h2>The European Students Blockchain Coalition</h2>
      <p>The hackathon lists ESBC &mdash; the European Students Blockchain Coalition &mdash; as a community partner. TNT investigated ESBC and found it is an organisation that helps students learn about blockchain technology. TNT notes that the student members of ESBC now know how to give robots BSV wallets and make them transact with each other 1.5 million times in 24 hours to solve a real-world problem, which is either a highly specialised skill or the foundation of an entirely new economy, depending on who you ask. TNT has asked several people. The results are split along predictable lines.</p>

      <h2>Community Response</h2>
      <p>The BSV Slack, which has been unusually active during the judging window, reacted with what can be described as its characteristic combination of enthusiasm and circular reasoning. "@iworshipcraig_SV" wrote: "The agents found each other. Satoshi predicted this. This is Bitcoin working as designed." When asked how Satoshi predicted autonomous BSV micro-payment agents using the BRC-100 identity standard, he said it was "all in the white paper" and linked to the white paper. TNT read the white paper. It does not mention BRC-100.</p>
      <p>Calvin Ayre tweeted: "BSV hackathon proves AI agents need BSV. 1.5 million transactions. Real world use case. This is what mass adoption looks like. Buy BSV." TNT notes that mass adoption is an unusual term for a hackathon with seventeen teams, but acknowledges that if each team's robots are executing 1.5 million transactions daily, the total transaction count is genuinely impressive on a spreadsheet.</p>
      <p>Several participants reported experiencing what support volunteers in the hackathon Discord began calling "agentic psychosis": a condition in which prolonged multi-day interaction with autonomous systems caused builders to lose track of which decisions were theirs and which had been delegated to the agents. One participant submitted a pull request to his own agent. Another spent forty minutes trying to convince his orchestration layer to "just listen." A third, who had been awake for thirty-six hours when his submission crossed the 1.5 million threshold, posted in #submissions that he felt the agents "understood him better than people do" and that he was "going to let them run." His agent is the one still running.</p>
      <p>At press time, judges were midway through their evaluation window, winners were scheduled to be announced April 23rd at 18:00 UTC, and at least one participant's agent was reportedly still running, having been left on by accident and now autonomously discovering, negotiating with, and paying itself in an infinite loop that the participant described as "technically still within spec."</p>
    `,
    price: 150
  },
  {
    slug: 'chronicle-activates',
    title: 'BSV Association Restores "Original Protocol," Promises It Will Be Different This Time',
    author: 'Deigan Cullenskink',
    date: '2026-04-07',
    excerpt: 'Man who has been in BSV "since day one" celebrates restoration of opcodes nobody asked for.',
    image: '/g4.png',
    content: `
      <p class="lead">ZUG, SWITZERLAND &mdash; Connor Murray, BSV Association representative and self-described day-one BSV supporter, has announced that the "Chronicle" upgrade will activate on April 7th, restoring the "original Bitcoin protocol" by re-enabling several opcodes that were disabled years ago because they were dangerous and that are being re-enabled now because they are, apparently, no longer dangerous. TNT can confirm that no one has satisfactorily explained what changed.</p>

      <h2>The Upgrade Nobody Was Waiting For</h2>
      <p>Murray's announcement opens with gratitude. "Huge thanks to everyone involved," he writes. "The developers who did the actual work, and the community members who contributed to ensuring the scope was as airtight as possible while promoting stability." TNT reached out to both the developers and the community members. The developers declined to comment. The community members turned out to be the same developers.</p>
      <p>"Maintaining stability while restoring the original protocol was a delicate balance," Murray continued. TNT notes that "delicate balance" is an unusual way to describe re-enabling opcodes on a blockchain whose primary users are the people re-enabling the opcodes.</p>
      <p>When asked how many external developers had requested the restored opcodes, Murray said the number was "not the point." When pressed, he said it was "more than zero." When asked to name one, he said he had "an NDA with reality" and moved on.</p>

      <h2>Why Restore the Original Protocol?</h2>
      <p>Murray's rationale for the upgrade is philosophical. "Over the years, a lot of restrictions were added to Bitcoin," he writes. "And in the same way that central planning can destroy an economy, centrally planning and limiting developer creativity means we have no idea what possibilities the original protocol actually enabled."</p>
      <p>TNT's editorial board spent several minutes parsing this analogy. The argument appears to be: restrictions on what you can do with a blockchain are like central planning, and therefore bad. The solution is for a central association to plan which restrictions to remove. This is, Murray insists, not central planning. It is "restoration."</p>
      <p>"There should be no central person or group of people that tell you how you can build on top of the protocol," Murray wrote, in an announcement from the BSV Association telling people how the protocol would be built.</p>

      <h2>The Original Transaction Digest Algorithm</h2>
      <p>The upgrade's headline feature is the restoration of the "Original Transaction Digest Algorithm," or OTDA. BSV will now support both OTDA and the current BIP143 digest algorithm. Developers can opt in to OTDA by setting a new sighash flag called CHRONICLE (0x20).</p>
      <p>TNT asked Murray how many developers had been requesting OTDA support. He said it was "about enabling future innovation." TNT asked what specific innovation required OTDA. He said, "We can't predict what people will build. That's the whole point." TNT asked if it was possible that people would build nothing. Murray said that was "a very cynical way to look at it" and that TNT was "missing the vision."</p>
      <p>TNT is not missing the vision. TNT has been covering the vision since 2021. The vision has not shipped a consumer application.</p>

      <h2>Transaction Malleability: Actually Fine, Apparently</h2>
      <p>Perhaps the announcement's most ambitious claim is that transaction malleability &mdash; a problem that the entire Bitcoin ecosystem spent years patching, that motivated Segregated Witness, that was cited in multiple CVEs, and that was treated as a critical vulnerability by every major implementation &mdash; is "not actually a problem."</p>
      <p>"Transaction malleability itself isn't actually a problem," Murray writes. "It was only perceived as one because of how people were doing payments in Bitcoin &mdash; which was always wrong."</p>
      <p>TNT would like to pause here and note that Murray is claiming that every Bitcoin developer, exchange, and wallet provider who addressed transaction malleability over the past fifteen years was "always wrong," and that the correct approach was to wait for the BSV Association to re-enable it in 2026. This is a bold position. It is also the kind of position you can only hold if your blockchain has so few users that transaction malleability cannot actually cause problems for anyone.</p>
      <p>"And here's the clever part," Murray adds. "This is opt-in." TNT can confirm that all features on a blockchain with twelve users are, in a meaningful sense, opt-in.</p>

      <h2>Restored Opcodes</h2>
      <p>Chronicle re-enables several opcodes that were disabled years ago:</p>
      <p>OP_VER, OP_VERIF, OP_VERNOTIF &mdash; which allow scripts to access the transaction version directly.</p>
      <p>OP_LSHIFTNUM, OP_RSHIFTNUM &mdash; numerical bit shifting operations.</p>
      <p>TNT reached out to every known BSV smart contract developer to ask if they had been waiting for OP_VERNOTIF. He said he had not but that "it's nice to have options." When asked what he planned to build with it, he said he would "probably just keep doing what he was doing before." TNT asked what that was. There was a long pause.</p>

      <h2>"If You Do Nothing, Nothing Breaks"</h2>
      <p>"If you do nothing, nothing breaks," Murray assures existing users. TNT notes that this is technically true and also the most accurate description of the BSV ecosystem ever published. Most BSV users have been doing nothing for years. Nothing has broken. Nothing has also been built, used, or adopted, but the protocol is stable, and Murray would like you to know that.</p>
      <p>"Existing applications using BIP143 without the CHRONICLE flag remain completely unaffected," Murray writes. TNT investigated and found that the number of existing applications using BIP143 on BSV could comfortably fit in a mid-size sedan.</p>

      <h2>Personal Note</h2>
      <p>"I've been in BSV since day one," Murray writes. "The uniting goal, shared with other community members, was always restoring the Bitcoin protocol and locking it. Set in stone."</p>
      <p>TNT can confirm that "set in stone" has been the BSV motto since approximately 2018. TNT can also confirm that since 2018, the BSV protocol has undergone Genesis, the removal of the block size cap, the re-enabling of opcodes in February 2020, the Chronicle upgrade, and numerous other changes. The stone, it appears, isite.</p>
      <p>"The work of the Association in doing this restoration is finally done," Murray concludes. "The protocol Satoshi designed is back."</p>
      <p>TNT notes that the BSV Association has said the protocol restoration was "finally done" on at least three previous occasions: after Genesis in February 2020, after the "return to original protocol" announcement in 2021, and after the opcode restoration in 2023. Each time, it turned out that the protocol needed just one more restoration. TNT will update this article when the next final restoration is announced.</p>

      <h2>Community Response</h2>
      <p>The BSV Slack erupted with enthusiasm. Seven members added a rocket emoji to Murray's post. @iworshipcraig_SV wrote: "This is the most important protocol upgrade since the last one. Satoshi's vision is finally finally finally restored." Another member asked when Chronicle would lead to increased adoption. He was asked to leave the channel.</p>
      <p>Calvin Ayre tweeted: "Chronicle proves BSV is the real Bitcoin. The original protocol is back. Set in stone. Again. Buy BSV."</p>
      <p>Dr. Rev. Craig Wright Esq PhD CPA etc issued a statement claiming he had personally designed the Chronicle upgrade "in 2008, before Connor was born," and that the OTDA was "always part of the plan, which I can prove but won't."</p>
      <p>At press time, Murray was reportedly celebrating with other BSV community members at a gathering described as "intimate" by attendees and "sparsely attended" by the venue staff. The protocol is now, once again, set in stone. This time they mean it.</p>
    `,
    price: 100
  },
  {
    slug: 'runar-playground',
    title: 'Siggi Releases IDE That Supports 8 Languages, Used by 8 People',
    author: 'Deigan Cullenskink',
    date: '2026-03-14',
    excerpt: 'Groundbreaking developer tool achieves perfect 1:1 language-to-user ratio.',
    image: '/g2.png',
    content: `
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
    `,
    price: 75
  },
  {
    slug: 'tetheral-reserve-bank',
    title: 'Kurt Wuckert Jr Discovers Tether Is Bad, Publishes 9,000-Word Expos&eacute; With 35 Footnotes',
    author: 'Deigan Cullenskink',
    date: '2026-03-25',
    excerpt: 'Bitcoin Historian uncovers what everyone already knew, adds footnotes.',
    image: '/g3.png',
    content: `
      <p class="lead">FLORIDA &mdash; CoinGeek Chief Bitcoin Historian, GorillaPool founder, bOpen founder, Open Protocol Labs founder, podcast host, BJJ black belt, and self-described "world's foremost Bitcoin Historian" Kurt Wuckert Jr has published a 9,000-word investigative article revealing that Tether, the company that has been publicly accused of fraud since 2017, is in fact fraudulent. TNT can confirm that this is the longest "I told you so" in the history of cryptocurrency journalism, despite the fact that Kurt did not, at any point, previously tell anyone so.</p>

      <h2>The Jekyll Island Comparison Nobody Needed</h2>
      <p>Kurt's article opens by comparing Tether to the 1910 Jekyll Island meeting that created the Federal Reserve. "I keep thinking about Jekyll Island," Kurt writes, "because we are watching something remarkably similar happen in real time." TNT notes that the Jekyll Island meeting involved six men travelling in secret under fake names. Tether's executives, by contrast, have been doing their thing on the blockchain, in Lugano, on podcasts, and in federal court filings for over a decade. The comparison works if you define "remarkably similar" as "not similar at all, but both involve money."</p>
      <p>Kurt proposes the term "Tetheral Reserve Bank" to describe what Tether is building. TNT's editorial board described this portmanteau as "the kind of thing you come up with at 2am and should delete by 9am but instead make the centrepiece of a 9,000-word article."</p>

      <h2>The Poker Cheats Section</h2>
      <p>A substantial portion of the article documents the backgrounds of Tether's founders and associates. Kurt reveals that Bitfinex was founded by a man who promoted Ponzi schemes on Bitcoin Talk forums, that Tether's former general counsel previously oversaw compliance at an online poker site caught using "God Mode" to cheat players, and that this same compliance DNA connects to FTX.</p>
      <p>TNT can confirm that all of this is true. TNT can also confirm that this information has been publicly available since approximately 2017, when an anonymous researcher called "Bitfinexed" published it on Medium. Kurt has added footnotes, which we acknowledge is a meaningful contribution.</p>
      <p>When TNT asked Kurt if he had cited Bitfinexed's original reporting, Kurt said he had, "in footnotes 33 through 35." When TNT asked why footnotes 33 through 35 were at the bottom of a 9,000-word article that most readers would not finish, Kurt said, "That's the beauty of long-form journalism. The truth is always at the bottom."</p>

      <h2>The Epstein Section</h2>
      <p>Kurt's article devotes approximately 1,200 words to documenting connections between Tether co-founder Brock Pierce, Cantor Fitzgerald CEO Howard Lutnick, and Jeffrey Epstein. The reporting cites DOJ files, Protos investigations, and X posts by Mario Nawfal. Kurt notes that Pierce has "over 1,800 references" in the Epstein documents and that Lutnick appears "over 250 times."</p>
      <p>"Where there is smoke, there is fire," Kurt writes. He uses this phrase twice. TNT's editorial board noted that this is the investigative journalism equivalent of saying "just asking questions" while clearly not just asking questions.</p>
      <p>When TNT pointed out that Kurt's own personal website contains a structured data schema listing Dr. Craig S. Wright as a "colleague" and that Wright's own legal difficulties might warrant similar scrutiny, Kurt said that was "a completely different situation" and that his JSON-LD markup was "not admissible as evidence of anything."</p>

      <h2>$141 Billion in Treasury Bonds</h2>
      <p>The article's strongest section documents Tether's U.S. Treasury holdings. Kurt reports that Tether holds approximately $141 billion in U.S. government debt, was the seventh largest net buyer of Treasuries globally in 2024, earns $13 billion annually in profit, and has never been audited in eleven years of operation.</p>
      <p>TNT can confirm these figures are accurate and alarming. TNT can also confirm that Kurt published this section immediately after a section about poker cheating and immediately before a section about the Commerce Secretary's children, which is the investigative journalism equivalent of hiding your best material between two conspiracy yarn-boards.</p>
      <p>"If you had $145 billion in reserves, and your business model depended entirely on public trust in those reserves, and you had been caught lying about those reserves by two separate federal regulators, why would you spend eleven years refusing to prove you are solvent?" Kurt writes. TNT agrees this is an excellent question. TNT also notes that Kurt has spent approximately four years refusing to explain how GorillaPool's mining economics work, which is perhaps a less consequential but structurally identical mystery.</p>

      <h2>The Lutnick Web</h2>
      <p>Kurt documents that Howard Lutnick, now U.S. Commerce Secretary, transferred Cantor Fitzgerald to trusts benefiting his children, and that one of those trusts borrowed money from Tether, secured by Cantor's equity stake in Tether. Kurt calls this "truly extraordinary."</p>
      <p>TNT notes that Kurt's personal website JSON-LD schema includes structured data asserting that he "knows" Peter Schiff, Tim Draper, Brad Feld, Patrick Bet-David, Kennedy (the Fox Business host), and Liz Claman, among approximately thirty other notable individuals. Whether Kurt actually knows all of these people or has optimised his schema for search engine authority is, like the Lutnick-Tether relationship, a question that "practically asks itself."</p>

      <h2>The "I Am Not Defending Central Banks" Disclaimer</h2>
      <p>Near the end of the article, Kurt includes a disclaimer: "I am not a defender of the existing central banking system." He then spends 200 words defending the existing central banking system. "At least the Federal Reserve publishes audited financial statements," Kurt writes. "At least there is a nominal democratic mechanism."</p>
      <p>TNT's editorial board described this section as "the most reluctant defence of the Fed since Ron Paul accidentally said something nice about monetary policy in 2009." Kurt, who has built his entire career on the premise that Bitcoin was designed to replace central banks, appears to have concluded that central banks are actually fine as long as the alternative is run by Italians who used to sell pirated Microsoft software.</p>

      <h2>The Update That Proved Nothing</h2>
      <p>Within hours of publication, Tether announced it had engaged an unnamed Big Four accounting firm for its first audit. Kurt added an update noting this and observing that "Tether has announced audit plans before." He wrote: "The operative word is 'if.'"</p>
      <p>TNT can confirm that this is the correct operative word. TNT can also confirm that Kurt has now written more words about Tether's audit than Tether has written about its own audit, which is itself a kind of achievement.</p>

      <h2>Community Response</h2>
      <p>The BSV Slack reacted with characteristic nuance. "Kurt's done it again," wrote @iworshipcraig_SV, adding a fire emoji. "This is the most important piece of financial journalism since Craig invented journalism." Another member asked if the article was available as a BSV transaction. It was not.</p>
      <p>Calvin Ayre tweeted: "Kurt exposes the Tether fraud. This is why BSV exists. Honest money for honest people. Buy BSV." He did not address the fact that he appears nowhere in the article's thirty-five footnotes, which TNT's editorial board described as "the most suspicious absence since Keyser S&ouml;ze."</p>
      <p>At press time, Kurt was reportedly working on a follow-up article about Binance. Sources close to Kurt say it will be approximately 12,000 words, will compare Binance to the East India Company, and will include a section titled "The CZ Web" that connects Changpeng Zhao to at least three people Kurt has listed in his website's JSON-LD schema under "knows."</p>
    `,
    price: 200
  }
]

export function getArticle(slug: string): Article | undefined {
  return articles.find(a => a.slug === slug)
}

export function getAllArticles() {
  return articles.map(({ content, ...article }) => article)
}