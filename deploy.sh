#!/usr/bin/bash
pm2 list
pm2 start main.mjs --name its-p2e-game-server --watch
pm2 list
