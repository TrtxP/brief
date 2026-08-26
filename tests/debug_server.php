<?php
file_put_contents(__DIR__ . '/tests/debug_server.log', json_encode($_SERVER, JSON_PRETTY_PRINT));
