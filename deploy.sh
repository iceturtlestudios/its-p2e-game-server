#!/usr/bin/bash
pm2 list
pm2 start server.js --name tiny-multiplayer-server --watch
pm2 list
