import {Button} from '../../ui/Button.tsx';
import {Card} from '../../ui/Card.tsx';
import {InputField, SelectField} from '../../ui/Forms.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {ActionsLayout} from './ActionsLayout.tsx';

const scripts = ['/scripts/apps/actions/action-submit.js'];

type ActionDemoPageProps = {
  interval?: string;
  turns?: string;
  outcome?: string;
  error?: string;
};

export function ActionDemoPage({
  interval = '1000',
  turns = '5',
  outcome = 'succeeded',
  error,
}: ActionDemoPageProps) {
  return (
    <ActionsLayout title="Action demo" scripts={scripts}>
      <PageHeader
        title="Action demo"
        description="Run a harmless background action to exercise scheduling, progress logs, and results."
      />
      <Card
        title="Dummy action"
        description="Log one message per interval, then stop after the requested number of turns."
        class="max-w-xl"
      >
        <form
          id="dummy-action-form"
          method="post"
          action="/actions/demo"
          class="space-y-5"
          aria-describedby={error ? 'dummy-error' : undefined}
        >
          <InputField
            id="dummy-interval"
            name="intervalMs"
            label="Interval (milliseconds)"
            type="number"
            min="1"
            max="300000"
            step="1"
            required
            value={interval}
          />
          <InputField
            id="dummy-turns"
            name="turns"
            label="Number of turns"
            type="number"
            min="1"
            max="1000"
            step="1"
            required
            value={turns}
            validationMessage="Interval × turns must total no more than 5 minutes."
          />
          <SelectField id="dummy-outcome" name="outcome" label="End state" value={outcome}>
            <option value="succeeded">Succeed</option>
            <option value="failed">Fail</option>
            <option value="interrupted">Interrupt</option>
          </SelectField>
          {error ? (
            <p id="dummy-error" role="alert" class="type-body-small text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit">Run dummy action</Button>
        </form>
      </Card>
    </ActionsLayout>
  );
}
