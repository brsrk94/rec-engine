import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/fitsol.svg"
                alt="Fitsol"
                width={100}
                height={28}
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Smart energy efficiency assessments for industrial equipment. 
              Reduce costs, save energy, and lower emissions.
            </p>
          </div>

          {/* Equipment */}
          <div>
            <h3 className="mb-4 font-semibold">Equipment</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/assessment?type=motor" className="hover:text-foreground">
                  Industrial Motors
                </Link>
              </li>
              <li>
                <Link href="/assessment?type=compressor" className="hover:text-foreground">
                  Air Compressors
                </Link>
              </li>
              <li>
                <Link href="/assessment?type=air_conditioner" className="hover:text-foreground">
                  Air Conditioners
                </Link>
              </li>
              <li>
                <Link href="/assessment?type=led_retrofit" className="hover:text-foreground">
                  LED Retrofit
                </Link>
              </li>
              <li>
                <Link href="/assessment?type=dg_set" className="hover:text-foreground">
                  DG Sets
                </Link>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 font-semibold">Resources</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="#features" className="hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-foreground">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/assessment" className="hover:text-foreground">
                  Start Assessment
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Fitsol. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
