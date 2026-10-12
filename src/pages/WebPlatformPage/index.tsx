import { BrowserPlatformDemo } from '../../components/demos/BrowserPlatformDemo';
import { PageTitle } from '../../components/ui/PageTitle';
import styles from './index.module.scss';

export function WebPlatformPage() {
  return (
    <div className={styles.page}>
      <PageTitle
        eyebrow="13 / 浏览器平台"
        title="浏览器能力实验室"
        description="测量真实交互指标，并动手验证预加载、导航、原生浮层、分桶存储与 GPU 计算。"
        badge="Web Platform"
      />
      <BrowserPlatformDemo />
    </div>
  );
}
