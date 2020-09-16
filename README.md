# squid-uxui
Front-end framework with JSON style.
Create small, reusable components with HTML CSS and use it to build complex components by just writing JSON.

## How it works?
- `npm install squid-uxui`
- Create some components with HTML CSS (and save in a file with extension .ux)
```html
// form.ux
name: form.form;

// Styles defined here will be scoped to all elements within this component, including items.
<style>
  div > * {
    border: 1px solid dodgerblue;
  }
</style>

// Styles defined scoped attribute will be scoped to all elements within this component, excluding items.
<style scoped>
  .header {
    background-color: #0074D9;
  }
</style>

<form>
  <div>
    <div class="header">[title]</div>
    <items />
  </div>
</form>

// text-input.ux
name: form.text-input;

<div>
  [label]: <input type="text" name="[name]" value="[value]">
</div>

// button.ux
name: form.submit-button;

<span>
  <button type="submit"></button>
</span>
```
- Define your app in JSON form and render
```js
const app = {
  ux: 'form.form',
  title: 'Squid form',
  items: [
    {
      ux: 'form.text-input',
      label: 'What is your name?',
      name: 'name',
      value: 'John'
    },
    {
      ux: 'form.text-input',
      label: 'What do you do?',
      name: 'profession',
      value: 'dream',
      listeners: {
        keydown: (viewModel, event) => {
          viewModel.state.value += event.key;
        }
      }
    },
    {
      ux: 'form.submit-button'
    }
  ],
  listeners: {
    click: (viewModel, event) => {
      axios.post('/save', {
        name: viewModel.state.name,
        profession: viewModel.state.profession
      });
    }
  }
}

const genesisViewModel = UI.render(app);
```
- Start the app with command
`uxui serve -u /path/to/folder/of/.ux/files -e /path/to/app.js`
- Build the production ready app with command
`uxui build -u /path/to/folder/of/.ux/files -e /path/to/app.js`

## Command usage and options
```
usage: uxui [-h] -u UX_DIR -e APP_ENTRY [-p DEV_PORT] {serve,build}

Build UXUI framework app

Positional arguments:
  {serve,build}         serve - Starts dev server with hot reload. build - 
                        Generates production ready webpacked files.

Optional arguments:
  -h, --help            Show this help message and exit.
  -u UX_DIR, --ux-dir UX_DIR
                        Directory containing .ux files.
  -e APP_ENTRY, --app-entry APP_ENTRY
                        App entry file (.js .ts).
  -p DEV_PORT, --dev-port DEV_PORT
                        Dev server port.
```
