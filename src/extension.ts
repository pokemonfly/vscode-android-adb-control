import * as vscode from "vscode";
const { commands, window } = vscode;
const process = require("child_process");
const OPEN_VIEW_COMMAND = "alc.openView";

function exec(cmd: string) {
  return new Promise((res, rej) => {
    process.exec(cmd, function(error: any, stdout: any) {
      if (error !== null) {
        console.log("exec error: " + error);
        rej(error);
      }
      res(stdout);
    });
  });
}

// function test() {
//   exec(`adb exec-out screencap -p D:\\test.png`).then(async () => {
//     // vscode.workspace.fs
//     //   .readFile(vscode.Uri.file("D:\\test.png"))
//     //   .then(data => {});
//   });
// }

export function activate(context: vscode.ExtensionContext) {
  // test();

  let { subscriptions } = context;
  // 创建Icon
  let openViewBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  openViewBarItem.text = `$(versions)`;
  openViewBarItem.command = OPEN_VIEW_COMMAND;
  subscriptions.push(openViewBarItem);

  openViewBarItem.show();

  // 加载HTML文件
  let webviewHTML: string = "";
  vscode.workspace.fs
    .readFile(vscode.Uri.file(context.asAbsolutePath("./out/webview.html")))
    .then(data => {
      webviewHTML = data.toString();
    });

  subscriptions.push(
    commands.registerCommand(OPEN_VIEW_COMMAND, async () => {
      // const a = await exec(`adb devices -l`);
      // console.log(a);

      const panel = vscode.window.createWebviewPanel(
        "control",
        "AndroidLocalControl",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = webviewHTML;

      panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case "alert":
              vscode.window.showErrorMessage(message.text);
              return;
          }
        },
        undefined,
        context.subscriptions
      );

      const updateWebview = () => {
        const path = context.asAbsolutePath("./cap.png");
        exec(`adb exec-out screencap -p > ${path}`).then(() => {
          vscode.workspace.fs.readFile(vscode.Uri.file(path)).then(data => {
            let url = new Buffer(data).toString("base64");
            console.log(url.length)
            panel.webview.postMessage({
              pic: url
            });
          });
        });
      };
      updateWebview();
      const interval = setInterval(updateWebview, 10000);
      panel.onDidDispose(
        () => {
          // When the panel is closed, cancel any future updates to the webview content
          clearInterval(interval);
        },
        null,
        context.subscriptions
      );
    })
  );
}

export function deactivate() {}
