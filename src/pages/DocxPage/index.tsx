import { DocxStudio } from '../../components/demos/DocxStudio';
import { PageTitle } from '../../components/ui/PageTitle';
import styles from './index.module.scss';

export function DocxPage() {
  return (
    <div className={styles.page}>
      <PageTitle
        eyebrow="14 / 文档生成"
        title="Word 文档工作台"
        description="在网页文档中直接编辑报告、指标和版式，再导出含原生图表与水印的 DOCX。"
        badge="DOCX 9.9.0"
      />
      <DocxStudio />
    </div>
  );
}
