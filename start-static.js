#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

// Run Vite directly for static frontend
const vite = spawn('npx', ['vite', '--port', '5000', '--host', '0.0.0.0'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

vite.on('close', (code) => {
  console.log(`Vite exited with code ${code}`);
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});