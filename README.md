# Ice Turtle Studios 

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Q5Q2JHUHV)

## Play 2 Earn Game Template (P2E is optional with settings)

### Support this project by Purchasing a GG Bot Here!
- https://opensea.io/collection/its-gg-bots
- https://www.iceturtlestudios.com/nft_gg_bots/mint/
 
## In Progress (Still Under Development)   

## Requirements:
- Node.js (Tested with v16 and v17 only)
- https://www.npmjs.com/package/nodemon (globally installed)
- setup account here https://www.alchemy.com/ for API keys on your project

## Development (localhost)   
- npm install
- copy the ".env.example" to ".env"
- edit the ".env" with your alchemy API keys and settings FIRST!! (USER CONFIG) 
- npm start (to run and test locally - nodemon watches your changes and reloads automatically)  
- or use _RUN.bat on windows (npm start)

## Deployment Details (Coming Soon)  
- Every deployment is different (AWS, Azure, VPS, etc)  
- Please see your hosting service documentation to run a Node.js/Websocket App  

### See deploy.sh for pm2 example (once you have it on a server)  
#!/usr/bin/bash  
pm2 list  
pm2 start main.mjs --name its-p2e-game-server --watch  
pm2 list  

### If you have feedback or find bugs let us know, thanks!!
- https://www.iceturtlestudios.com/contact/


## Game Help (HTML5 - Help Button as well)

P2E Game Template DEMO (TESTING)
All ITS GG Bot NFT Owners will get this Game Template
You can adjust/customize art/code as you like!
Earn income when running your own game!
Buy in and Payouts are low for testing (0.1 MATIC)

- Simple RogueLike GamePlay (Collect/Avoid)
- Players Earn by getting the highest score per round (Multiplayer) = 0.1 MATIC
- Owner/ITS Earn small amount/tip per round as well (Players earn the most)
- Buy Credits First (Credits are the same as lives)
- Spawn to play (at anytime)(will be random on the borders of map)
- Red highlighted bot is yours
- Use W, A, S, D to move your character (bot)
- Collect Food, Treasure to earn points
- Avoid NPC bots (only NPCs will cause damage)
- Respawn as needed (costs 1 credit)
- Buy more credits as needed
- At the start of the round there is a brief cooldown to spawn and plan
- Enjoy!
