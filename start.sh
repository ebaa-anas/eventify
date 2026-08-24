#!/bin/sh
npx prisma migrate deploy
node src/server.ts