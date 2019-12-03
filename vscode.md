## vscode 扩展

参考 API : https://code.visualstudio.com/api

# 扩展用途

- 注册命令, 设置, 按键绑定, 右键菜单项
- 存储工作区或者全局数据
- 显示通知
- 收集用户输入
- 打开系统选择文件窗口让用户选择文件或者文件夹
- 使用Progress Api来显示需要长时间运行的操作
- 改变界面颜色图标 主题
- 添加自定义组件和视图(比如侧边栏TreeView)  
- 添加webview 显示自定义网页
- 支持新的编程语言
- 支持调试特定的runtime
- PS:不允许修改当前界面UI 比如应用自定义css或者添加HTML元素到VsCode UI

# 基础知识

- 基于 electron , 通过 webview 渲染
- vscode 扩展运行进程与 vscode 主进程互相独立
- vscode 扩展都是按需加载
- vscode UI 组件非常简洁，也几乎没有可扩展性

# Start

使用官方的脚手架 初始化项目

```
npm install -g yo generator-code

yo code

# ? What type of extension do you want to create? New Extension (TypeScript)
# ? What's the name of your extension? HelloWorld
### Press <Enter> to choose default for all options below ###

# ? What's the identifier of your extension? helloworld
# ? What's the description of your extension? LEAVE BLANK
# ? Initialize a git repository? Yes
# ? Which package manager to use? npm

code ./helloworld
```
# 入口

package.json 中指定了 "main": "./out/extension.js",
导出注册的钩子函数 
activate 当你的激活事件触发时
deactivate 销毁操作触发时

# 扩展的配置文件 package.json

配置 contributes 字段
详情参考 https://code.visualstudio.com/api/references/contribution-points

- configuration 自定义你扩展的配置项。你可以在扩展中通过如下命令获取用户的配置值

- commands (cmd + p 可以打命令面板) 所有行为都会被定义为命令，然后在菜单项行为、快捷键行为定义中引用该命令

- keybindings 定义快捷键和它对应的 command

- views 添加视图

# 发布

- 本地打包成vsix文件 (可安装)

```
npm install -g vsce
vsce package
```

- 发布到商店
参考 https://code.visualstudio.com/api/working-with-extensions/publishing-extension