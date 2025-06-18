import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Server } from "lucide-react"

interface SetupInstructionsProps {
  connectionStatus: "connected" | "disconnected" | "checking"
}

export function SetupInstructions({ connectionStatus }: SetupInstructionsProps) {
  if (connectionStatus === "connected") {
    return (
      <Card className="mb-4 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <CardTitle className="text-green-800 dark:text-green-200">Backend Connected</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 dark:text-green-300 text-sm">
            Successfully connected to HidayahAI backend. You can now ask questions about Islamic teachings.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <CardTitle className="text-amber-800 dark:text-amber-200">Backend Setup Required</CardTitle>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          The FastAPI backend is not running. Follow these steps to connect:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-amber-800 dark:text-amber-200">1. Start your FastAPI backend:</h4>
          <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-md">
            <code className="text-sm text-amber-800 dark:text-amber-200">python islamic_truth_verifier_api.py</code>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-amber-800 dark:text-amber-200">2. Set environment variable:</h4>
          <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-md">
            <code className="text-sm text-amber-800 dark:text-amber-200">BACKEND_URL=http://localhost:8000</code>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            <Server className="w-3 h-3 mr-1" />
            Demo Mode Active
          </Badge>
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Mock responses will be shown until backend is connected
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
