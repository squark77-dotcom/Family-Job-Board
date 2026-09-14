import { Card, CardContent } from '@/components/ui/card';
import { Ghost, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background selection:bg-primary/20">
      <Card className="w-full max-w-md mx-4 shadow-xl border-border rounded-[2rem] overflow-hidden">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border">
            <Ghost className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h1 className="text-4xl font-display font-extrabold text-foreground tracking-tight mb-3">
            Lost in space
          </h1>
          <p className="text-lg text-muted-foreground font-medium mb-8">
            We couldn't find the page you're looking for.
          </p>
          <Button asChild className="h-12 px-8 rounded-xl font-bold shadow-md shadow-primary/20 active:scale-95 transition-all">
            <Link href="/">
              <Home className="w-5 h-5 mr-2" /> Return Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
