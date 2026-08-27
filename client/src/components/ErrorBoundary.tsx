import { Home, RotateCcw, ShieldAlert } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f9f7f2] p-6 text-[#173b31]">
          <section className="w-full max-w-xl rounded-[2rem] border border-[#d9d5ca] bg-white p-8 text-center shadow-[0_20px_50px_rgba(23,59,49,0.10)] sm:p-12" role="alert" aria-labelledby="market-error-title">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1e8] text-[#17664f]">
              <ShieldAlert aria-hidden="true" size={28} />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#cd6f5a]">MtaaMarket needs a moment</p>
            <h1 id="market-error-title" className="font-display text-3xl font-semibold tracking-tight text-[#173b31]">This page did not finish loading.</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#4b6259]">
              Your request has not been sent. You can try again, or return to the public market and continue browsing safely.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17664f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#125440] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17664f]"
              >
                <RotateCcw aria-hidden="true" size={16} />
                Try this page again
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#b8c7ba] bg-white px-5 py-3 text-sm font-semibold text-[#173b31] transition hover:border-[#17664f] hover:bg-[#f3f6f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17664f]"
              >
                <Home aria-hidden="true" size={16} />
                Return to MtaaMarket
              </a>
            </div>
            <p className="mt-6 text-xs leading-5 text-[#697a73]">For your protection, technical details are not shown on this public page.</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
