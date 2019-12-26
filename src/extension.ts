import * as vscode from "vscode";
import * as process from "child_process";

const OPEN_VIEW_COMMAND = "alc.openView";
const PORT = 53519;

function exec(cmd: string) {
  console.log("cmd: ", cmd);
  return new Promise<string>((res, rej) => {
    process.exec(cmd, function(error, stdout: string) {
      if (error !== null) {
        console.error("exec error: " + error);
        rej(error);
      }
      res(stdout);
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
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
  const jqueryFile = vscode.Uri.file(
    context.asAbsolutePath("./out/jquery.min.js")
  );

  vscode.workspace.fs
    .readFile(vscode.Uri.file(context.asAbsolutePath("./out/webview.html")))
    .then(data => {
      webviewHTML = data.toString();
      webviewHTML = webviewHTML.replace("{{PORT}}", PORT.toString());
    });

  subscriptions.push(
    vscode.commands.registerCommand(OPEN_VIEW_COMMAND, async () => {
      // 开启服务
      let classPath = await exec(`adb shell pm path com.rayworks.droidcast`);
      classPath = classPath.replace("package:", "");
      classPath = classPath.replace(/\.apk\s+/, ".apk");
      await exec(`adb forward tcp:${PORT} tcp:${PORT}`);

      console.log(
        "cmd: ",
        `adb shell CLASSPATH=${classPath} app_process / com.rayworks.droidcast.Main --port=${PORT}`
      );
      let handler = process.spawn("adb", [
        "shell",
        `CLASSPATH=${classPath}`,
        "app_process",
        "/",
        "com.rayworks.droidcast.Main",
        `--port=${PORT}`
      ]);
      const panel = vscode.window.createWebviewPanel(
        "control",
        "AndroidLocalControl",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = "<html><body>loading...</body></html>";
      webviewHTML = webviewHTML.replace(
        "{{jQuery}}",
        panel.webview.asWebviewUri(jqueryFile).toString()
      );
      let isRun = false;
      handler.stdout.on("data", data => {
        if (!isRun) {
          panel.webview.html = webviewHTML;
          isRun = true;
        }
      });
      panel.webview.onDidReceiveMessage(
        (message: { command: "tap" | "swipe"; data: number[] }) => {
          let cmd = `adb shell input ${message.command} ${message.data}`;
          exec(cmd);
        },
        undefined,
        context.subscriptions
      );
      panel.onDidDispose(
        () => {
          handler.kill();
          isRun = false;
        },
        null,
        context.subscriptions
      );
    })
  );
}

export function deactivate() {}
