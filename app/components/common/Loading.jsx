// app/components/common/Loading.jsx
export default function Loading({ message = 'Loading...' }) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    );
  }