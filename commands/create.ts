import prompts from 'prompts';
import {run} from '../utils/exec.ts';

const setupMaterial = async () => {
    console.log('🗿 Adding Angular Material...');
    await run('ng add @angular/material --defaults --theme=azure-blue --skip-confirmation');
}

const setupTailwind = async () => {
    console.log('✨ Adding TailwindCSS...');

    await run('bun add tailwindcss @tailwindcss/postcss postcss --force')
    await Bun.write('.postcssrc.json', JSON.stringify({
        plugins: {
            "@tailwindcss/postcss": {}
        }
    }, null, 2));
    const stylesFile = Bun.file('./src/styles.css');
    await stylesFile.write(`@import "tailwindcss";\n${await stylesFile.text()}`);
}

const setupElectron = async (name: string) => {
    console.log('⚡️ Adding Electron...');
    await run('bun add -d electron @electron-forge/cli concurrently wait-on');
    await run('bunx electron-forge import');

    // Add scripts to package.json
    const pkg = JSON.parse(await Bun.file(`package.json`).text());
    pkg.main = `electron/main.js`;
    pkg.scripts[`electron:build`] = `ng build --base-href ./`;
    pkg.scripts[`electron:start`] = `bun run electron:build && bunx electron-forge start`;
    pkg.scripts[`electron:dev`] = `concurrently -k -n "NG,ELEC" -c "magenta,cyan" "ng serve" "bun run wait-and-electron"`;
    pkg.scripts.electron = `electron .`;
    pkg.scripts[`wait-and-electron`] = `wait-on http://localhost:4200 && bun run electron`;

    await Bun.write(`package.json`, JSON.stringify(pkg, null, 2));

    // Crea main.js para Electron
    const mainJs = `
const { app, BrowserWindow } = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')) {
    app.quit();
    return;
}

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/${name}/browser/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
  `.trim();

    await Bun.write(`electron/main.js`, mainJs, {createPath: true});
    await Bun.write(`electron/preload.js`, ``, {createPath: true});
}

export async function create() {
    const response = await prompts([
        {
            type: 'text',
            name: 'project',
            message: 'Project name:',
            validate: (val: string) => val === '' ? 'Project name is required' : true
        },
        {
            type: 'multiselect',
            name: 'tools',
            message: 'Which optional tools do you want to include?',
            hint: '- Space to select. Enter to confirm',
            choices: [
                {title: 'Angular Material', value: 'material'},
                {title: 'Tailwind CSS', value: 'tailwind'},
                {title: 'Electron', value: 'electron'},
            ],
            instructions: false,
            min: 0
        }
    ]);

    const wantsMaterial = response.tools.includes('material');
    const wantsTailwind = response.tools.includes('tailwind');
    const wantsElectron = response.tools.includes('electron');

    const name = response.project;

    if (!name) {
        return;
    }

    console.log(`🚀 Creating project: ${name}...`);
    await run(`ng new ${name} --defaults --package-manager=bun`);
    process.chdir(name);

    if (wantsMaterial) {
        await setupMaterial();
    }

    if (wantsTailwind) {
        await setupTailwind();
    }

    if (wantsElectron) {
        await setupElectron(name);
    }

    console.log(`✅ Project created!`);
    if (wantsElectron) {
        console.log(`➡️ Run 'cd ${name} && bun run electron:start' to launch the app. Or 'cd ${name} && bun run electron:dev' for developer mode`)
    } else {
        console.log(`➡️ Run 'cd ${name} && ng serve' to launch the app.`);
    }
}