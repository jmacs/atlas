import {Terminal} from '@lucide/icons';
import {Button} from '../../ui/Button.tsx';
import {Dialog} from '../../ui/Dialog.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {Icon} from '../../ui/Icon.tsx';
import {TextLogViewer} from '../../ui/TextLogViewer.tsx';
import {AtlasLayout} from './AtlasLayout.tsx';

type LogViewerPageProps = {
  log: string;
};

export function LogViewerPage({log}: LogViewerPageProps) {
  return (
    <AtlasLayout activePath="/atlas/log-viewer" title="Log Viewer">
      <PageHeader title="Log Viewer" description="Inspect Atlas logs." />
      <TextLogViewer
        id="atlas-log-viewer"
        title="Atlas log"
        regionLabel="Atlas application log"
        emptyMessage="No log entries yet."
        log={log}
        headerIcon={<Icon icon={Terminal} size={18} class="text-muted" />}
        controls={
          <Button
            variant="danger"
            size="sm"
            hx-get="/atlas/log-viewer/clear-confirmation"
            hx-target="#clear-log-dialog .dialog__panel"
            hx-swap="innerHTML"
            isLoading="htmx"
          >
            Clear log
          </Button>
        }
      />
      <Dialog id="clear-log-dialog" aria-label="Clear Atlas log confirmation" />
    </AtlasLayout>
  );
}
