# Ice Turtle Studios 

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
