import { WasmAudioDemo } from '../../components/demos/WasmAudioDemo';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import styles from './index.module.scss';

export function WasmAudioPage() {
  return (
    <div className={styles.page}>
      <PageTitle
        eyebrow="08 / WebAssembly"
        title="音频编解码"
        description="在 WASM 中运行 16 位 PCM 与 8 位 μ-law 之间的转换，观察体积减半后的波形和声音损失。"
        badge="本地处理"
      />
      <SectionTitle
        index="B"
        title="压缩、还原与播放"
        detail="使用内置波形或上传音频。上传文件会先在浏览器解码并降采样到 8 kHz，最多取前 5 秒。"
      />
      <WasmAudioDemo />
    </div>
  );
}
