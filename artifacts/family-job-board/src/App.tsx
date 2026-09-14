import { useEffect, useRef, ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, ClerkLoaded } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";

// App Pages
import Home from "@/pages/home";
import Setup from "@/pages/setup";
import Today from "@/pages/app/today";
import Board from "@/pages/app/board";
import Review from "@/pages/app/review";
import Contributions from "@/pages/app/contributions";
import Family from "@/pages/app/family";

import { useGetCurrentUser } from "@workspace/api-client-react";
import { AppLayout } from "./components/layout/app-layout";
import { FullScreenLoader } from "./components/ui/full-screen-loader";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(12 76% 61%)",
    colorForeground: "hsl(20 20% 20%)",
    colorMutedForeground: "hsl(20 10% 45%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(40 33% 98%)",
    colorInputForeground: "hsl(20 20% 20%)",
    colorNeutral: "hsl(30 20% 90%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border/50",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-display text-2xl font-bold text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "font-medium text-foreground",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary font-semibold hover:text-primary/80",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all",
    formFieldInput: "bg-background border border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-secondary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
      <div className="relative z-10">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] bg-secondary/10 rounded-full blur-3xl -translate-y-1/3 -translate-x-1/4"></div>
      <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-3xl translate-y-1/4 translate-x-1/4"></div>
      <div className="relative z-10">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { data: profile, isLoading, isError } = useGetCurrentUser({ 
    query: { retry: 1, queryKey: ["/api/me"] } 
  });
  
  if (isLoading) {
    return <FullScreenLoader message="Waking up the family board..." />;
  }

  // If user profile is not fully setup or has no family, redirect to setup
  if (!isError && profile && !profile.family) {
    return <Redirect to="/setup" />;
  }

  // If user is loaded and has a family, they can see the app
  return <AppLayout>{children}</AppLayout>;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app/today" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function AppRoutes() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        
        {/* Setup Route - authenticated but outside AppLayout */}
        <Route path="/setup">
          <Show when="signed-in">
            <Setup />
          </Show>
          <Show when="signed-out">
            <Redirect to="/sign-in" />
          </Show>
        </Route>

        {/* Protected App Routes */}
        <Route path="/app/:rest*">
          <Show when="signed-in">
            <AuthGuard>
              <Switch>
                <Route path="/app/today" component={Today} />
                <Route path="/app/board" component={Board} />
                <Route path="/app/review" component={Review} />
                <Route path="/app/contributions" component={Contributions} />
                <Route path="/app/family" component={Family} />
                <Route component={NotFound} />
              </Switch>
            </AuthGuard>
          </Show>
          <Show when="signed-out">
            <Redirect to="/sign-in" />
          </Show>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome to the Family",
            subtitle: "Sign in to access your jobs",
          },
        },
        signUp: {
          start: {
            title: "Join the Family Board",
            subtitle: "Create your parent or child account",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <ClerkQueryClientCacheInvalidator />
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
