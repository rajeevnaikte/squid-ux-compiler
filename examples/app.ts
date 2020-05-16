import { ComponentDef, UI } from 'squid-ui';

export const app: ComponentDef = {
  ux: 'panel.my-panel',
  name: '',
  items: [
    {
      ux: 'form.field.textinput'
    }
  ]
};

UI.render(app);
