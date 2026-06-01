import { Skeleton } from "@mui/material";

export function ExamSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="text" width={100} />
          </div>
          <Skeleton variant="text" width={80} />
        </div>
        <Skeleton variant="rectangular" height={6} />
      </div>

      <div className="bg-gray-50 rounded-t-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-1">
          <Skeleton variant="text" width={200} />
          <Skeleton variant="text" width={100} />
        </div>
        <Skeleton variant="text" width={150} />
      </div>

      <div className="bg-white rounded-b-lg shadow-sm p-6 mb-6 border-x border-b border-gray-200">
        <div className="flex gap-2 mb-4">
          <Skeleton variant="text" width={20} />
          <Skeleton variant="text" width={300} />
        </div>

        <div className="ml-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" width={200} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Skeleton
          variant="rectangular"
          width={100}
          height={40}
          className="rounded-md"
        />
        <Skeleton
          variant="rectangular"
          width={100}
          height={40}
          className="rounded-md"
        />
      </div>
    </div>
  );
}
