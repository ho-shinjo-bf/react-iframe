"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scroller } from "react-scroll";
import "./page.css";

const scrollToMessage = (event: MessageEvent<{ type: string; id: string }>) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data.type === "scrollTo") {
    scroller.scrollTo(event.data.id, {
      duration: 500,
      smooth: true,
    });
  }
};

const resizeIframe = (iframe: HTMLIFrameElement) => {
  if (iframe.contentWindow?.document.body.scrollHeight) {
    iframe.style.height =
      iframe.contentWindow.document.body.scrollHeight + "px";
  }
};

export default function Home() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);

  const afterIframeLoaded = useCallback(() => {
    if (iframeRef.current) {
      resizeIframe(iframeRef.current);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // resize event
    window.addEventListener("resize", afterIframeLoaded);

    window.addEventListener("message", scrollToMessage);

    return () => {
      window.removeEventListener("resize", afterIframeLoaded);
      window.removeEventListener("message", scrollToMessage);
    };
  }, [afterIframeLoaded, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* iframe */}
      <iframe
        src="/send.html"
        title="Send"
        width="100%"
        height="100%"
        ref={iframeRef}
        onLoad={afterIframeLoaded}
        className="overflow-hidden border-none"
      />
      <section id="contact" className="contact">
        <div className="container">
          <h2>Contact Us</h2>
          <p>
            If you have any questions or would like to learn more about our
            services, please get in touch.
          </p>
          <form>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" required />

            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />

            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={4} required />

            <button type="submit">Submit</button>
          </form>
        </div>
      </section>

      <footer>
        <div className="container">
          <p>&copy; 2024 Tech Company. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
