---
title: >-
  BSV Association Restores "Original Protocol," Promises It Will Be Different
  This Time
excerpt: >-
  Man who has been in BSV "since day one" celebrates restoration of opcodes
  nobody asked for.
author: Deigan Cullenskink
date: '2026-04-07'
price: 100
image: /images/g4.png
---
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
