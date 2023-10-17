import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  AdHocFiltersVariable,
  QueryVariable,
  SceneComponentProps,
  sceneGraph,
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
  VariableValueOption,
} from '@grafana/scenes';
import { Field, RadioButtonGroup, useStyles2 } from '@grafana/ui';

import { VAR_FILTERS } from './shared';

export interface VariableTabLayoutState extends SceneObjectState {
  variableName: string;
  body: SceneObject;
}

/**
 * Just a proof of concept example of a behavior
 */
export class VariableTabLayout extends SceneObjectBase<VariableTabLayoutState> {
  public onSplitChange = (split: boolean) => {
    if (this.state.body instanceof SplittableLayoutItem) {
      this.state.body.setState({ isSplit: split });
    }
  };

  public getSplitState(): { splittable: boolean; isSplit: boolean } {
    if (this.state.body instanceof SplittableLayoutItem) {
      return { splittable: true, isSplit: this.state.body.state.isSplit };
    }

    return { isSplit: false, splittable: false };
  }

  public getLabelNamesFiltered(options: VariableValueOption[]) {
    const labelFilters = sceneGraph.lookupVariable(VAR_FILTERS, this);
    const labelOptions: Array<SelectableValue<string>> = [];

    if (!(labelFilters instanceof AdHocFiltersVariable)) {
      return [];
    }

    const filters = labelFilters.state.set.state.filters;

    for (const option of options) {
      const filterExists = filters.find((f) => f.key === option.value);
      if (!filterExists) {
        labelOptions.push({ label: option.label, value: String(option.value) });
      }
    }

    return labelOptions;
  }

  public static Component = ({ model }: SceneComponentProps<VariableTabLayout>) => {
    const { variableName, body } = model.useState();
    const styles = useStyles2(getStyles);
    const variable = sceneGraph.lookupVariable(variableName, model);

    body.useState();

    if (!variable) {
      return <div>Variable {variableName} not found</div>;
    }

    if (!(variable instanceof QueryVariable)) {
      return <div>Variable not QueryVariable</div>;
    }

    const { loading, options } = variable.useState();
    const radioOptions = [
      { value: false, label: 'Single graph' },
      { value: true, label: 'Split' },
    ];

    let { splittable, isSplit } = model.getSplitState();
    const labelOptions = model.getLabelNamesFiltered(options);

    return (
      <div className={styles.container}>
        {loading && <div>Loading...</div>}
        <div className={styles.controls}>
          <Field label="By label">
            <RadioButtonGroup
              options={labelOptions}
              value={variable.state.value}
              onChange={(v) => variable.changeValueTo(v)}
            />
          </Field>

          {splittable && (
            <Field label="View">
              <RadioButtonGroup options={radioOptions} value={isSplit} onChange={model.onSplitChange} />
            </Field>
          )}
        </div>
        <div className={styles.content}>
          <body.Component model={body} />
        </div>
      </div>
    );
  };
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      flexGrow: 1,
      display: 'flex',
      minHeight: '100%',
      flexDirection: 'column',
    }),
    content: css({
      flexGrow: 1,
      display: 'flex',
      paddingTop: theme.spacing(0),
    }),
    tabHeading: css({
      paddingRight: theme.spacing(2),
      fontWeight: theme.typography.fontWeightMedium,
    }),
    controls: css({
      flexGrow: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }),
  };
}

export interface SplittableLayoutItemState extends SceneObjectState {
  isSplit: boolean;
  single: SceneObject;
  split: SceneObject;
}

export class SplittableLayoutItem extends SceneObjectBase<SplittableLayoutItemState> {
  public static Component = ({ model }: SceneComponentProps<SplittableLayoutItem>) => {
    const { isSplit, split, single } = model.useState();

    return isSplit ? <split.Component model={split} /> : <single.Component model={single} />;
  };
}
