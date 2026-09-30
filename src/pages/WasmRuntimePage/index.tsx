import { WasmCapabilityDemo } from '../../components/demos/WasmCapabilityDemo';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import styles from './index.module.scss';

export function WasmRuntimePage() {
  return (
    <div className={styles.page}>
      <PageTitle
        eyebrow="11 / WebAssembly"
        title="GC 与 WASI 运行时"
        description="检查浏览器支持的 WASM 特性，理解 WASM GC 与 WASI Preview 2 分别解决什么问题。"
        badge="能力边界"
      />
      <SectionTitle
        index="E"
        title="当前浏览器能力"
        detail="检测的是引擎能力；具体 Kotlin/Wasm、Dart/Wasm 应用还需要各自编译器和运行库。"
      />
      <WasmCapabilityDemo />
      <SectionTitle
        index="WASI"
        title="WASI Preview 2 组件"
        detail="WASI 是宿主提供的系统接口。普通浏览器不向任意 WASM 模块开放 OS 文件系统或套接字。"
      />
      <div className={styles.environment}>
        <div className={styles.explanation}>
          <h3>组件部署路径</h3>
          <ol>
            <li>用 WIT 定义跨语言接口与所需 WASI 能力。</li>
            <li>用支持 Component Model 的工具链生成组件。</li>
            <li>
              在 Wasmtime 等 Preview 2
              宿主上运行，并由宿主授予文件、网络或时钟访问。
            </li>
          </ol>
          <p>
            本页只展示接口和运行边界；浏览器实验使用 Core WASM
            模块，不宣称实现了 WASI Preview 2 宿主。
          </p>
        </div>
        <CodeBlock
          file="src/wasm/processor.wit"
          code={`package lab:processor@0.1.0;

world processor {
  import wasi:clocks/wall-clock@0.2.0;
  export count-bytes: func(input: list<u8>) -> u32;
}`}
        />
      </div>
    </div>
  );
}
