import * as vscode from "vscode";
const { commands, window } = vscode;
const process = require("child_process");
const OPEN_VIEW_COMMAND = "alc.openView";

function exec(cmd: string) {
  return new Promise((res, rej) => {
    process.exec(cmd, function(error: any, stdout: any) {
      if (error !== null) {
        console.error("exec error: " + error);
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
    commands.registerCommand(OPEN_VIEW_COMMAND, () => {
      let isAcitve = true;
      let interval: NodeJS.Timeout;

      const panel = vscode.window.createWebviewPanel(
        "control",
        "AndroidLocalControl",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = webviewHTML;

      panel.webview.onDidReceiveMessage(
        (message: { command: "tap" | "swipe"; data: number[] }) => {
          let cmd = `adb shell input ${message.command} ${message.data.join(
            " "
          )}`;
          exec(cmd);
        },
        undefined,
        context.subscriptions
      );

      const updateWebview = () => {
        const path = context.asAbsolutePath("./cap.png");
        exec(`adb exec-out screencap -p > ${path}`)
          .then(() => {
            vscode.workspace.fs.readFile(vscode.Uri.file(path)).then(data => {
              let url = new Buffer(data).toString("base64");
              panel.webview.postMessage({
                pic: url
              });
              isAcitve && setTimeout(updateWebview, 0);
            });
          })
          .catch(e => {
            console.error(e);
            vscode.window.showErrorMessage(e.message);
            if (isAcitve) {
              interval = setTimeout(updateWebview, 2e3);
            }
          });
      };

      updateWebview();

      panel.onDidDispose(
        () => {
          isAcitve = false;
          clearInterval(interval);
        },
        null,
        context.subscriptions
      );
    })
  );
}

export function deactivate() {}
