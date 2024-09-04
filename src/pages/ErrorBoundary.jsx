import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // 오류 발생 시 상태 업데이트
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 오류를 로그로 기록할 수 있음
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 오류가 발생했을 때 보여줄 UI
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-4xl font-bold mb-4">문제가 발생했습니다.</h1>
          <p className="text-lg">죄송합니다. 예기치 않은 오류가 발생했습니다.</p>
          <button
            onClick={() => window.location.href = '/'}  // 메인 페이지로 리다이렉트
            className="mt-5 bg-primary text-white py-2 px-4 rounded"
          >
            메인 페이지로 이동
          </button>
        </div>
      );
    }

    // 오류가 없을 때는 자식 컴포넌트를 렌더링
    return this.props.children;
  }
}

export default ErrorBoundary;
