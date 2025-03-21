// app/components/common/Footer.jsx
export default function Footer() {
    return (
      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} PrePostTEST. Created by Aidil Saputra Kirsan</p>
        </div>
      </footer>
    );
  }