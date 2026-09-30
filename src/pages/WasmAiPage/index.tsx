import { WasmAiDemo } from '../../components/demos/WasmAiDemo';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import styles from './index.module.scss';

export function WasmAiPage() {
  return (
    <div className={styles.page}>
      <PageTitle
        eyebrow="09 / WebAssembly"
        title="浏览器端 AI 推理"
        description="TensorFlow.js 在 Worker 中训练小型异常分类模型，并用本地 WASM 后端对设备读数推理。"
        badge="完全本地运行"
      />
      <SectionTitle
        index="C"
        title="设备异常分类"
        detail="首次点击会用合成数据训练小模型，随后可调整温度、振动和电流重新推理。数据与计算都留在浏览器；这个教学模型没有真实设备预测精度。"
      />
      <WasmAiDemo />
    </div>
  );
}
