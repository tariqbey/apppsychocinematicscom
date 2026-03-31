import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  featureName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.featureName || "Feature"}] Error:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Scene Interrupted
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {this.props.featureName
                ? `The ${this.props.featureName} hit a snag.`
                : "Something went off-script."}
            </p>
          </div>
          <Button
            onClick={this.handleRetry}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Scene
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
