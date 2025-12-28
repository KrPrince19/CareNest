import Image from "next/image";
import LandingPage from "./components/Landingpage";
import RoleSelectionPage from "./components/Rolepage";
import { useSession, signIn, signOut, } from "next-auth/react"
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import RolePage from "./components/Rolepage";

export default function Home() {
  return (
    <>
    {/* <SignedOut
    > */}
    <LandingPage></LandingPage>
    {/* </SignedOut> */}
    {/* <SignedIn> */}
    {/* <RolePage></RolePage> */}
    {/* </SignedIn> */}
    </>
  );
}
