import { WasmImageDemo } from '../../components/demos/WasmImageDemo';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import styles from './index.module.scss';

export function WasmImagePage() {
  return (
    <div className={styles.page}>
      <PageTitle
        eyebrow="07 / WebAssembly"
        title="图片像素处理"
        description="将 RGBA 像素拷入线性内存，在 WASM 中逐像素处理，再写回 Canvas。可上传自己的图片并导出 PNG。"
        badge="AssemblyScript → WASM"
      />
      <SectionTitle
        index="A"
        title="像素管线"
        detail="切换灰度、反色和阈值；耗时包含 JS 与 WASM 之间的内存拷贝，不代表与 JS 的公平基准测试。"
      />
      <WasmImageDemo />
    </div>
  );
}
