import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-medium mb-12" style={{ color: '#3e3832' }}>
        Support Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Teams Card */}
        <Link href="/teams" className="block group">
          <div
            className="border p-6 transition-all duration-200 group-hover:shadow-sm"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e5dfd8',
              borderRadius: '4px'
            }}
          >
            <h3 className="text-base font-medium mb-2" style={{ color: '#3e3832' }}>
              Team Management
            </h3>
            <p className="text-sm" style={{ color: '#a8998a' }}>
              Search and manage teams
            </p>
          </div>
        </Link>

        {/* Credits Card */}
        <Link href="/credits" className="block group">
          <div
            className="border p-6 transition-all duration-200 group-hover:shadow-sm"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e5dfd8',
              borderRadius: '4px'
            }}
          >
            <h3 className="text-base font-medium mb-2" style={{ color: '#3e3832' }}>
              Add Credits
            </h3>
            <p className="text-sm" style={{ color: '#a8998a' }}>
              Manage team credits
            </p>
          </div>
        </Link>

        {/* Rate Limits Card */}
        <Link href="/rate-limits" className="block group">
          <div
            className="border p-6 transition-all duration-200 group-hover:shadow-sm"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e5dfd8',
              borderRadius: '4px'
            }}
          >
            <h3 className="text-base font-medium mb-2" style={{ color: '#3e3832' }}>
              Rate Limits
            </h3>
            <p className="text-sm" style={{ color: '#a8998a' }}>
              Adjust API rate limits
            </p>
          </div>
        </Link>

        {/* Sales Nav Accounts Card */}
        <Link href="/sales-nav-accounts" className="block group">
          <div
            className="border p-6 transition-all duration-200 group-hover:shadow-sm"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e5dfd8',
              borderRadius: '4px'
            }}
          >
            <h3 className="text-base font-medium mb-2" style={{ color: '#3e3832' }}>
              Sales Nav Accounts
            </h3>
            <p className="text-sm" style={{ color: '#a8998a' }}>
              Toggle account status
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
