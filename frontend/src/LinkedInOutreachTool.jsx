
import { useState, useEffect } from "react"
import { Linkedin, Copy, Send, CheckCircle, AlertCircle, Loader2, ArrowLeft, Sparkles, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function LinkedInOutreachTool() {
  // State Management
  const [step, setStep] = useState("login") // 'login', 'profile', 'message', 'success'
  const [profile, setProfile] = useState(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)

  // API Configuration
  const API_BASE_URL = "http://localhost:5000"

  // API Integration Functions
const handleLinkedInAuth = () => {
  const dummyToken = "your_unipile_token_here";
  const dummyUserId = "your_unipile_user_id_here";

  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set("token", dummyToken);
  newUrl.searchParams.set("user_id", dummyUserId);

  window.location.href = newUrl.toString(); // full reload with params
};


  const loadProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`);

      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await response.json();
      console.log("✅ LinkedIn profile data:", data);

      // Example: move to step 2 if profile exists
      if (data.success && data.data?.length > 0) {
        setStep("message");
      } else {
        console.warn("⚠️ No LinkedIn account found");
      }
    } catch (err) {
      console.error("❌ Error fetching profile:", err.message);
    }
  };


  const handleGenerateMessage = async () => {
    try {
      setLoading(true)
      setError("")
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/api/generate-message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile }),
      })

      if (!response.ok) throw new Error("Failed to generate message")

      const data = await response.json()
      setMessage(data.message)
      setStep("message")
    } catch (err) {
      setError("Failed to generate message: " + err.message)
    } finally {
      setLoading(false)
    }
  }

const handleSendMessage = async () => {
  try {
    setLoading(true)
    setError("")

    const token = localStorage.getItem("access_token")
    const recipientId = localStorage.getItem("user_id")

    const response = await fetch(`${API_BASE_URL}/api/send-message`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, recipientId }),
    })

    if (!response.ok) throw new Error("Failed to send message")

    setStep("success")
  } catch (err) {
    setError("Failed to send message: " + err.message)
  } finally {
    setLoading(false)
  }
}



  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const resetToLogin = () => {
    setStep("login")
    setProfile(null)
    setMessage("")
    setError("")
    localStorage.removeItem("access_token")
  }

  // Handle OAuth callback on component mount
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const userId = urlParams.get("user_id");
  const errorParam = urlParams.get("error");

  if (token && userId) {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user_id", userId);
    setStep("profile");
    loadProfile();
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (errorParam) {
    setError("Authentication failed");
  }
}, []);


  // Step Indicator Component
  const StepIndicator = () => {
    const steps = [
      { id: "login", label: "Connect", number: 1 },
      { id: "profile", label: "Profile", number: 2 },
      { id: "message", label: "Message", number: 3 },
      { id: "success", label: "Success", number: 4 },
    ]

    const getCurrentStepIndex = () => {
      return steps.findIndex((s) => s.id === step)
    }

    const currentIndex = getCurrentStepIndex()

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((stepItem, index) => (
          <div key={stepItem.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index <= currentIndex ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {index < currentIndex ? <CheckCircle className="w-4 h-4" /> : stepItem.number}
            </div>
            <span className={`ml-2 text-sm font-medium ${index <= currentIndex ? "text-blue-600" : "text-gray-500"}`}>
              {stepItem.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-4 ${index < currentIndex ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  // Login Screen
  const LoginScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <StepIndicator />
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">LinkedIn Outreach AI</CardTitle>
            <p className="text-gray-600 mt-2">Generate personalized outreach messages with AI</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleLinkedInAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
              disabled={loading}
            >
              <Linkedin className="w-5 h-5 mr-2" />
              Connect with LinkedIn
            </Button>
            <p className="text-xs text-gray-500 text-center">
              We'll use your LinkedIn profile to generate personalized messages
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Profile Screen
  const ProfileScreen = () => (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <StepIndicator />

        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={resetToLogin} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Loading profile...</span>
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-gray-600 font-medium">{profile.jobTitle}</p>
                    <p className="text-gray-500">{profile.company}</p>
                    <Badge variant="secondary" className="mt-2">
                      {profile.industry}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateMessage}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate AI Message
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No profile data available</p>
                <Button onClick={loadProfile} variant="outline" className="mt-4 bg-transparent">
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Message Generator Screen
  const MessageScreen = () => (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <StepIndicator />

        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => setStep("profile")} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Generated Message</h1>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {profile && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{profile.name}</p>
                        <p className="text-sm text-gray-600">{profile.jobTitle}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Company:</strong> {profile.company}
                      </p>
                      <p>
                        <strong>Industry:</strong> {profile.industry}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Your Personalized Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={message}
                  readOnly
                  className="w-full min-h-[120px] p-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 resize-none focus:outline-none"
                  placeholder="Your generated message will appear here..."
                />

                {copySuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">Message copied to clipboard!</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="flex-1 bg-transparent"
                    disabled={!message}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Message
                  </Button>

                  <Button
                    onClick={handleSendMessage}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading || !message}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send via LinkedIn
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  onClick={handleGenerateMessage}
                  variant="outline"
                  className="w-full bg-transparent"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate New Message
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )

  // Success Screen
  const SuccessScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <StepIndicator />
        <Card className="shadow-xl text-center">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Message sent successfully!</h2>
            <p className="text-gray-600 mb-8">Your personalized outreach message has been sent via LinkedIn.</p>
            <Button
              onClick={resetToLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
            >
              Start New Outreach
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render appropriate screen based on step
  const renderScreen = () => {
    switch (step) {
      case "login":
        return <LoginScreen />
      case "profile":
        return <ProfileScreen />
      case "message":
        return <MessageScreen />
      case "success":
        return <SuccessScreen />
      default:
        return <LoginScreen />
    }
  }

  return renderScreen()
}
