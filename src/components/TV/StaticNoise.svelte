<script lang="ts">
    import { onMount } from "svelte";

    let canvas: HTMLCanvasElement;

    onMount(() => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;

        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };

        const drawNoise = () => {
            if (!canvas) return;
            const w = canvas.width;
            const h = canvas.height;
            const idata = ctx.createImageData(w, h);
            const buffer32 = new Uint32Array(idata.data.buffer);
            const len = buffer32.length;

            for (let i = 0; i < len; i++) {
                if (Math.random() < 0.1) {
                    // Occasional white pop
                    buffer32[i] = 0xffffffff;
                } else if (Math.random() < 0.1) {
                    // Occasional black pop
                    buffer32[i] = 0xff000000;
                } else {
                    // Grey noise
                    const val = Math.random() * 255;
                    buffer32[i] =
                        (255 << 24) | // Alpha
                        (val << 16) | // Blue
                        (val << 8) | // Green
                        val; // Red
                }
            }

            ctx.putImageData(idata, 0, 0);

            // Throttle FPS slightly for analog feel ~30fps
            // animationFrameId = requestAnimationFrame(drawNoise);
            setTimeout(() => {
                animationFrameId = requestAnimationFrame(drawNoise);
            }, 30);
        };

        window.addEventListener("resize", resize);
        resize();
        drawNoise();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    });
</script>

<canvas
    bind:this={canvas}
    class="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-80"
></canvas>
