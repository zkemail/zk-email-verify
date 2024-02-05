# Contributing 

## Guidelines for Contributing 

1. **Check for Existing Work:** Before starting on an issue, please ensure that it is not already being addressed by someone else. This helps avoid duplicate efforts.

2. **Express Your Interest:** If you find an issue you'd like to work on, add a comment to it expressing your interest. A member of our team will then reach out to you for a brief discussion.

3. **Assignment of Issues:** Following a mutual agreement during our discussion, we will formally assign the issue to you. This indicates that you are the main contributor working on that particular issue.

4. **Submitting Your Work:** Once you have resolved the issue, please submit a Pull Request (PR) with your solution. Ensure that your PR description clearly states the problem it solves and any relevant details.

5. **Review and Merging:** Our team will review your PR. This process includes checking that it passes all necessary tests and effectively resolves the issue. If your contribution meets these criteria, we will merge it into the project.

## Understanding Issue Labels

Our issues are categorized by labels to help you identify tasks that might interest you:

- `bug`: Something isn't working as expected.
- `dependencies`: Tasks related to updating or fixing dependencies.
- `documentation`: Improvements or additions to our documentation.
- `duplicate`: Issues that have already been reported.
- `easy`: Good first issues for newcomers.
- `enhancement`: New features or requests for the project.
- `good first issue`: Recommended for individuals who are new to the project.
- `help wanted`: Issues where extra attention is needed.
- `high`: High priority issues that need to be addressed quickly.
- `invalid`: Issues that do not seem right or are not relevant.
- `low`: Low priority issues.
- `medium`: Issues with a medium level of priority.
- `project`: Issues related to project management or overarching tasks.
- `question`: Issues where further information is requested.
- `refactor`: Code refactoring tasks.
- `wontfix`: Issues that have been decided not to be worked on.

Feel free to filter issues by these labels to find what suits your skills and interests.

## Incentives for Contributions
We are excited to announce that we will award a $50-$200 bounty for every Pull Request (PR) that is successfully merged and addresses an open issue in our repository. Should there be any oversight on our part regarding the bounty, please feel free to send us a direct message as a reminder.

## Project Ideas
We have curated a list of exciting project ideas that we believe would significantly enhance the functionality and user experience of our platform. We encourage contributors to explore these ideas and bring them to fruition. We will give a grant for any successful implementation.


| Title | Description |
|-------|-------------|
| **Bountied Whistleblowing Project** | A bounty platform for leaks where people can bid on leaks with specific sources (i.e. from `@___`) and specific text (i.e. includes the phrase "`___`"). It creates an escrow system on chain where others can upload those anonymized leaks along with zk-email proofs that they satisfy the regexes, and reveal only the parts that they want to reveal. |
| **Arxiv Donation Project** | Put in an arxiv link, and a bot scrapes all the emails out of the PDF/Arxiv itself. It then scrapes all of the emails off of all of the dependencies and allows the donor to reweight them based on where they appeared in the text (i.e. it defaults to something like, cited in previous work or methods splits 40% of the donation, authors cited in intro split 10% of the funds or whatever). It then deploys zk-email wallets for all of them and sends them the money. |
| **AttestationStation Attestations for Twitter etc** | Convert the Twitter demo to an official AttestationStation/PolygonID attestation. |
| **Automatic Spotify Splits for AI Voice Royalities** | Prove via zk-email on Spotify confirmation emails and EZKL proof of voi e via ML, that you used an artists voice and split profit with them. Details at https://hackmd.io/Nf8mSSKwRIu3GYyhGq5f9A |
| **Proof of Residence** | Prove via some emailed confirmation sent by some government or service that you filed taxes or payed for property in that country, and make only the country public. |
| **Proof of Credit Score** | Enable undercollateralized, crypto lending by allowing someone to prove their credit score on-chain via a confirmaton email from a credit score provider. |
| **General Oracles** | Prove any oracled data in emails, such as a NASDAQ daily ticker email for the price of some stock, or a Robinhood spot price confirmation. Tradingview Alerts should be able to support this. |
| **Investor Interest** | Prove some investor emailed you a term sheet, and mint a credential that lets you anonymously disclose how your interactions with them were. |
| **2FA On-Chain** | Account transactions on-chain above a certain amount need to be verified via an email from your email address as well. Utilize a relayer to automatically prompt users when they see a transaction on chain, and proof of a confirmation reply with a later timestamp will auth the transaction. Will likely be easiest to fork email wallet V1 relayers and parsing to create this. |
| **Multisig Control via Email** | Native integration with SAFE or other multi-sig wallets to allow zk-emails to be direct multisig signers, interacting and approving transactions via emails. |
| **Legal Discovery** | When subpoena'd, people can turn over only a relevant subset of their emails, not all of them. I don't know if this is robust though, since unless Gmail commits to a Merkle root of all your emails or something, people can always hide whatevver emails they want from the proving process. |
| **DNSSEC Lobbying** | Lobby providers like Google, Outlook etc, to enable DNSSEC on their keys in order to have more permissionless key upgrades. This is a great fit for someone with less ZK experience or who is really good at talking to people. |
| **Emailing an Image Mints an NFT** | Add an extra base64 decoding step atop the attachments, and then reformat it to have the image on-chain. This will let someone email you an image, and it automatically goes on-chain (i.e. can directly mint an NFT for it, if you so wish). |
| **EZKL + ZK Email** | Use machine learning to parse an email contents and reveal only the outputs of the ML model. This can concern NLP summary of an email, or parsing of a document (again if you add the base64 decoding first). |


## Interested in Contributing?

1. **Explore Our Organization:** Start by visiting our main GitHub organization page at https://github.com/zkemail. Here you'll find an overview of our project and its objectives.

2. **Discover Our Repositories:** We have a variety of repositories, each focusing on different aspects of our project. Some of the key ones include:
   - Zk-email-verify: https://github.com/zkemail/zk-email-verify
   - Email wallet: https://github.com/zkemail/email-wallet
   - Proof of twitter: https://github.com/zkemail/proof-of-twitter
  
   ...and many more!

   Each repository has its own set of issues, documentation, and contribution needs. Feel free to explore these to find a project that resonates with your interests and skills.

3. **Stay Updated:** We regularly update our repositories with new features and issues. Keep an eye on the ones that interest you the most.

4. **Join Our Community:** If you have any questions or need guidance, don't hesitate to reach out. Join our community telegram at https://t.me/zkemail. 
