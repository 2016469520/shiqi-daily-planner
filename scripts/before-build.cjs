/**
 * electron-builder beforeBuild 钩子：返回 false 表示「node_modules 由我们自己处理，你不用管」。
 *
 * 时栖的前端已经完全静态化（`out/`），Electron 主进程只用 electron 本体和 Node 内置模块，
 * electron-builder.yml 的 files 里也显式排除了 node_modules，所以运行时不需要任何三方依赖。
 *
 * 但 electron-builder 默认仍会去收集依赖树：它会 spawn 系统 shell 执行 `npm list` 来拿 JSON。
 * 在没有把系统 shell 目录放进 PATH 的环境里（CI 的精简镜像、只带 bash 的终端），这一步会
 * 直接 ENOENT 失败；即使 shell 在，也可能因为输出为空而报 "No JSON content found in output"。
 * 打包结果本来就不含 node_modules，这次收集纯属白跑，所以这里直接跳过。
 */
module.exports = async function beforeBuild() {
  return false
}
