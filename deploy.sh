#!/usr/bin/bash
pm2 list
pm2 start server.js --name its-p2e-game-server --watch
pm2 list
