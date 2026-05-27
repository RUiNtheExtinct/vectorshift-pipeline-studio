import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <img
            className="app-logo"
            src={`${process.env.PUBLIC_URL}/logo.svg`}
            alt="Pipeline Studio logo"
          />
          <div>
            <span className="eyebrow">VectorShift Assessment</span>
            <h1>Pipeline Studio</h1>
          </div>
        </div>
        <SubmitButton />
      </header>
      <main className="workspace">
        <PipelineToolbar />
        <PipelineUI />
      </main>
    </div>
  );
}

export default App;
