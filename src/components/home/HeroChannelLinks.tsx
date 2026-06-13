"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, QrCode, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HomeHeroChannel } from "@/types/lab";

type HeroChannelLinksProps = {
  channels: HomeHeroChannel[];
};

function ChannelText({ channel }: { channel: HomeHeroChannel }) {
  return (
    <>
      <span className="site-hero__channel-dot" aria-hidden="true" />
      <span className="site-hero__channel-text">
        <span className="site-hero__channel-name">{channel.label}</span>
        <span className="site-hero__channel-meta">{channel.desc}</span>
      </span>
    </>
  );
}

function HeroLinkChannel({ channel }: { channel: HomeHeroChannel & { kind: "link"; href: string } }) {
  const ariaLabel = `${channel.label}, ${channel.desc}`;

  return (
    <li className="site-hero__channel-item site-hero__channel-item--link">
      <a
        href={channel.href}
        className="site-hero__channel-pill site-hero__channel-pill--link"
        aria-label={ariaLabel}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ChannelText channel={channel} />
        <ArrowUpRight className="site-hero__channel-icon" aria-hidden size={15} strokeWidth={2.25} />
      </a>
    </li>
  );
}

function HeroQrChannel({ channel }: { channel: HomeHeroChannel & { kind: "qr"; qrImage: string } }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();
  const [open, setOpen] = useState(false);
  const ariaLabel = `${channel.label}, ${channel.desc}`;

  function openDialog() {
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function closeDialog() {
    dialogRef.current?.close();
    setOpen(false);
  }

  return (
    <li className={cn("site-hero__channel-item site-hero__channel-item--qr", open && "site-hero__channel-item--open")}>
      <button
        type="button"
        className="site-hero__channel-pill site-hero__channel-pill--qr"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogTitleId}
        aria-label={`${ariaLabel}, show QR code`}
        onClick={openDialog}
      >
        <ChannelText channel={channel} />
        <QrCode className="site-hero__channel-icon" aria-hidden size={15} strokeWidth={2.25} />
      </button>

      <dialog
        ref={dialogRef}
        className="site-hero__channel-dialog"
        aria-labelledby={dialogTitleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          const dialog = dialogRef.current;
          if (!dialog) {
            return;
          }

          const rect = dialog.getBoundingClientRect();
          const clickedBackdrop =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom;

          if (clickedBackdrop) {
            closeDialog();
          }
        }}
      >
        <div className="site-hero__channel-dialog-panel">
          <button
            type="button"
            className="site-hero__channel-dialog-close"
            aria-label="Close QR code"
            onClick={closeDialog}
          >
            <X aria-hidden size={16} strokeWidth={2.25} />
          </button>
          <div className="site-hero__channel-dialog-body">
            <h2 id={dialogTitleId} className="site-hero__channel-dialog-title">
              {channel.label}
            </h2>
            <Image
              src={channel.qrImage}
              alt={`${channel.label} QR code`}
              width={220}
              height={220}
              className="site-hero__channel-dialog-qr"
            />
            <p className="site-hero__channel-dialog-caption">{channel.desc}</p>
          </div>
        </div>
      </dialog>
    </li>
  );
}

export default function HeroChannelLinks({ channels }: HeroChannelLinksProps) {
  if (channels.length === 0) {
    return null;
  }

  return (
    <nav className="site-hero__channels" aria-label="Lab social channels">
      <ul className="site-hero__channels-list">
        {channels.map((channel) => {
          const key = `${channel.label}-${channel.href ?? channel.qrImage}`;

          if (channel.kind === "qr" && channel.qrImage) {
            return <HeroQrChannel key={key} channel={{ ...channel, kind: "qr", qrImage: channel.qrImage }} />;
          }

          if (channel.kind === "link" && channel.href) {
            return <HeroLinkChannel key={key} channel={{ ...channel, kind: "link", href: channel.href }} />;
          }

          return null;
        })}
      </ul>
    </nav>
  );
}
