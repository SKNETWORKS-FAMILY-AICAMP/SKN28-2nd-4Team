from be import main


def test_main_runs(capsys) -> None:
    main()
    captured = capsys.readouterr()
    assert captured.out.strip() == "be workspace is ready"
