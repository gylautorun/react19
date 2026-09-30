import { WasmFractalDemo } from '../../components/demos/WasmFractalDemo';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import styles from './index.module.scss';

export function WasmFractalPage() {
  return (
    <div className={styles.page}>
      <PageTitle
        eyebrow="10 / WebAssembly"
        title="计算可视化"
        description="Worker 调用 WASM 计算 Mandelbrot 像素，主线程负责交互和 Canvas 绘制。点击图像可深入边界。"
        badge="Worker + WASM"
      />
      <SectionTitle
        index="D"
        title="缩放分形视域"
        detail="改变视域和迭代上限，观察计算时间。这个实验展示密集数值计算与界面线程的分工。"
      />
      <WasmFractalDemo />
    </div>
  );
}
