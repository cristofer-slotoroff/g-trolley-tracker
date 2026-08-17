# Re-encode a screen recording to H.264 at a chosen bitrate, keeping the full resolution. Uses AVAssetReader/Writer.
import sys, time, objc
import AVFoundation as AV, CoreMedia as CM, Foundation as F
src, dst, kbps = sys.argv[1], sys.argv[2], int(sys.argv[3])
asset = AV.AVURLAsset.URLAssetWithURL_options_(F.NSURL.fileURLWithPath_(src), None)
vtrack = asset.tracksWithMediaType_(AV.AVMediaTypeVideo)[0]
w, h = vtrack.naturalSize().width, vtrack.naturalSize().height
reader, err = AV.AVAssetReader.assetReaderWithAsset_error_(asset, None)
rout = AV.AVAssetReaderTrackOutput.assetReaderTrackOutputWithTrack_outputSettings_(vtrack, {"PixelFormatType": 0x34323076})  # '420v'
reader.addOutput_(rout)
F.NSFileManager.defaultManager().removeItemAtPath_error_(dst, None)
writer, err = AV.AVAssetWriter.assetWriterWithURL_fileType_error_(F.NSURL.fileURLWithPath_(dst), AV.AVFileTypeMPEG4, None)
settings = {AV.AVVideoCodecKey: AV.AVVideoCodecTypeH264, AV.AVVideoWidthKey: int(w), AV.AVVideoHeightKey: int(h),
            AV.AVVideoCompressionPropertiesKey: {AV.AVVideoAverageBitRateKey: kbps*1000, AV.AVVideoProfileLevelKey: AV.AVVideoProfileLevelH264HighAutoLevel}}
win = AV.AVAssetWriterInput.assetWriterInputWithMediaType_outputSettings_(AV.AVMediaTypeVideo, settings)
win.setTransform_(vtrack.preferredTransform())
writer.addInput_(win)
reader.startReading(); writer.startWriting(); writer.startSessionAtSourceTime_(CM.kCMTimeZero)
n = 0
while True:
    while not win.isReadyForMoreMediaData(): time.sleep(0.01)
    sb = rout.copyNextSampleBuffer()
    if sb is None: break
    win.appendSampleBuffer_(sb); n += 1
win.markAsFinished()
done = [False]
writer.finishWritingWithCompletionHandler_(lambda: done.__setitem__(0, True))
while not done[0]: time.sleep(0.05)
print("frames", n, "status", writer.status(), "size", int(w), "x", int(h))
